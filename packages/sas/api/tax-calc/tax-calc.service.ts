import { Service } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

export interface TaxCalcInput {
    costCenterId: string;
    grossAmount: number;
    referenceMonth?: string; // YYYY-MM
    orderId?: string; // exclude this order from monthly sum when editing
}

export interface DeductionItem {
    name: string;
    amount: number;
    percent?: number; // aliquota efetiva sobre o bruto (ex: 0.65 = 0,65%)
}

export interface TaxCalcResult {
    gross: number;
    deductions: DeductionItem[];
    totalDeductions: number;
    liquid: number;
}

const THRESHOLD_CSRF = 215.05;
const IRPJ_ADICIONAL_LIMIT_FALLBACK = 20000; // fallback se nao encontrar regra no BD
const IRPJ_ADICIONAL_RATE_FALLBACK = 0.10; // 10% padrao
const INSS_CAP_BASE = 7786.02;
const INSS_DEFAULT_RATE = 0.11;
const DEFAULT_PRESUMPTION_RATE = 32; // 32% para servicos (Lucro Presumido)

@Service()
export class TaxCalcService {
    /**
     * Soma do valor bruto das ordens do centro de custo no mes (excluindo orderId se informado).
     */
    private async getMonthlySumForCostCenter(
        costCenterId: string,
        referenceMonth: string,
        excludeOrderId?: string
    ): Promise<number> {
        const Entity = Repository.getEntity("SasPaymentOrdersEntity");
        const list = await Repository.findAll(Entity, { costCenterId, expectedPaymentMonth: referenceMonth }, []);
        const items = Array.isArray(list?.data) ? list.data : Array.isArray(list?.items) ? list.items : Array.isArray(list) ? list : [];
        let sum = 0;
        for (const o of items) {
            if (excludeOrderId && o.id === excludeOrderId) continue;
            sum += Number(o.invoiceAmount) || 0;
        }
        return sum;
    }

    /**
     * Motor de decisao: calcula deducoes e liquido a partir do centro de custo e valor bruto.
     */
    async calculate(input: TaxCalcInput): Promise<TaxCalcResult> {
        const gross = Number(input.grossAmount) || 0;
        const deductions: DeductionItem[] = [];
        const referenceMonth = input.referenceMonth || this.getCurrentMonth();

        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");
        const costCenter = await Repository.findOne(CostCentersEntity, { id: input.costCenterId });
        if (!costCenter) {
            return { gross, deductions, totalDeductions: 0, liquid: gross };
        }

        let fiscalProfile: Record<string, unknown> = {};
        const rawFP = costCenter.fiscal_profile ?? costCenter.fiscalProfile;
        if (rawFP) {
            try {
                fiscalProfile = typeof rawFP === "string"
                    ? JSON.parse(rawFP) : rawFP;
            } catch (_) {}
        }
        const personType = (fiscalProfile.personType as string) || "PJ";

        if (personType === "EXTERIOR") {
            const iof = (fiscalProfile.exteriorIof as number) != null ? Number(fiscalProfile.exteriorIof) : 0;
            if (iof > 0) {
                const iofAmount = (gross * iof) / 100;
                deductions.push({ name: "IOF", amount: iofAmount, percent: iof });
            }
            const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
            return { gross, deductions, totalDeductions, liquid: Math.max(0, gross - totalDeductions) };
        }

        if (personType === "PF") {
            const inssRate = (fiscalProfile.inssRate as number) != null ? Number(fiscalProfile.inssRate) / 100 : INSS_DEFAULT_RATE;
            const inssBase = Math.min(gross, INSS_CAP_BASE);
            const inssAmount = Math.round(inssBase * inssRate * 100) / 100;
            if (inssAmount > 0) deductions.push({ name: "INSS", amount: inssAmount, percent: inssRate * 100 });

            const useProgressive = fiscalProfile.irrfProgressiveTable === true;
            const irrfAmount = useProgressive ? this.irrfProgressive(gross) : (gross * 0.015);
            const irrfPct = gross > 0 ? Math.round((irrfAmount / gross) * 10000) / 100 : 0;
            if (irrfAmount > 0) deductions.push({ name: "IRRF", amount: Math.round(irrfAmount * 100) / 100, percent: irrfPct });
        }

        if (personType === "PJ") {
            const TaxRegimesEntity = Repository.getEntity("SasTaxRegimesEntity");
            const taxRegimeId = costCenter.tax_regime_id ?? costCenter.taxRegimeId;
            const regime = taxRegimeId
                ? await Repository.findOne(TaxRegimesEntity, { id: taxRegimeId })
                : null;
            const regimeCode = (regime?.code as string) || "";
            const isMeiRaw = costCenter.is_mei_optant ?? costCenter.isMeiOptant;
            const isMei = isMeiRaw === true || isMeiRaw === 1;

            if (regimeCode === "LUCRO_PRESUMIDO" && !isMei) {
                const presumptionPct = (fiscalProfile.presumptionRate != null && fiscalProfile.presumptionRate !== "")
                    ? Number(fiscalProfile.presumptionRate) : DEFAULT_PRESUMPTION_RATE;
                const presumptionRate = Math.min(100, Math.max(0, presumptionPct)) / 100;

                const monthlySum = await this.getMonthlySumForCostCenter(
                    input.costCenterId,
                    referenceMonth,
                    input.orderId
                );
                const monthlyGross = monthlySum + gross;
                const orderBaseIR = gross * presumptionRate;
                const monthlyBaseIR = monthlyGross * presumptionRate;

                // Buscar aliquotas por CC (ou fallback global)
                const pisRule = await this.getCcTaxRule(input.costCenterId, "PIS");
                const cofinsRule = await this.getCcTaxRule(input.costCenterId, "COFINS");

                const pisPct = pisRule && pisRule.active ? Number(pisRule.percentage) : 0.65;
                const cofinsPct = cofinsRule && cofinsRule.active ? Number(cofinsRule.percentage) : 3;

                const pisAmount = Math.round((gross * pisPct / 100) * 100) / 100;
                if (pisAmount > 0) deductions.push({ name: "PIS", amount: pisAmount, percent: pisPct });

                const cofinsAmount = Math.round((gross * cofinsPct / 100) * 100) / 100;
                if (cofinsAmount > 0) deductions.push({ name: "COFINS", amount: cofinsAmount, percent: cofinsPct });

                const csllPctOnGross = Math.round(presumptionRate * 0.09 * 10000) / 100; // ex: 0.32*0.09 = 2.88%
                const csllAmount = Math.round((orderBaseIR * 0.09) * 100) / 100;
                if (csllAmount > 0) deductions.push({ name: "CSLL", amount: csllAmount, percent: csllPctOnGross });

                // Buscar regra ADICIONAL_IRPJ do BD (por CC, depois global)
                const adicionalConfig = await this.getAdicionalIrpjConfig(input.costCenterId);

                if (monthlyBaseIR > 0) {
                    const proportion = orderBaseIR / monthlyBaseIR;

                    // IRPJ 15% sobre base presumida (proporcional a esta ordem)
                    const monthlyIR15 = monthlyBaseIR * 0.15;
                    let orderIR15 = Math.round(proportion * monthlyIR15 * 100) / 100;
                    const ir15PctOnGross = Math.round(presumptionRate * 0.15 * 10000) / 100; // ex: 0.32*0.15 = 4.80%
                    if (orderIR15 > 0) deductions.push({ name: "IRPJ", amount: orderIR15, percent: ir15PctOnGross });

                    // Adicional IRPJ sobre excedente do limite mensal (proporcional a esta ordem)
                    const monthlyAdicional = Math.max(0, (monthlyBaseIR - adicionalConfig.limit) * adicionalConfig.rate);
                    if (monthlyAdicional > 0) {
                        let orderAdicional = Math.round(proportion * monthlyAdicional * 100) / 100;
                        const adicPctOnGross = gross > 0 ? Math.round((orderAdicional / gross) * 10000) / 100 : 0;
                        deductions.push({ name: "IRPJ Adicional", amount: orderAdicional, percent: adicPctOnGross });
                    }
                }

                // ISS para Lucro Presumido: ISS = Receita * aliquota_municipio
                const issLpData = await this.getIssMunicipalityRate(costCenter);
                if (issLpData && gross > 0) {
                    const issAmount = Math.round((gross * issLpData.percent / 100) * 100) / 100;
                    if (issAmount > 0) deductions.push({ name: "ISS", amount: issAmount, percent: issLpData.percent });
                }
            } else if (regimeCode === "SIMPLES_NACIONAL" && !isMei && gross > 0) {
                let dasResult: { amount: number; percent: number } | null = null;
                let dasHint = "";
                try {
                    dasResult = await this.getSimplesNacionalDas(costCenter, input.costCenterId, gross, referenceMonth);
                    if (!dasResult) {
                        dasHint = await this.getSimplesNacionalDasHint(costCenter, input.costCenterId, referenceMonth);
                    }
                } catch (_) {
                    dasHint = "Erro ao calcular DAS. Verifique anexo e faturamento na Matriz Tributaria.";
                }
                if (dasResult) {
                    deductions.push({
                        name: "DAS (Simples Nacional)",
                        amount: dasResult.amount,
                        percent: dasResult.percent
                    });
                } else if (dasHint) {
                    deductions.push({
                        name: "DAS (Simples Nacional) - " + dasHint,
                        amount: 0,
                        percent: 0
                    });
                }
                const issRetentionSn = (fiscalProfile.issRetentionIndicator as string) || "";
                if (issRetentionSn === "RETEM_NA_FONTE") {
                    const issData = await this.getIssMunicipalityRate(costCenter);
                    if (issData) {
                        const issAmount = Math.round((gross * issData.percent / 100) * 100) / 100;
                        if (issAmount > 0) deductions.push({ name: "ISS", amount: issAmount, percent: issData.percent });
                    }
                }
            } else {
                const aplicaCsrf = !isMei && (regimeCode === "LUCRO_REAL" || regimeCode === "LUCRO_PRESUMIDO");
                if (aplicaCsrf) {
                    const monthlySum = await this.getMonthlySumForCostCenter(
                        input.costCenterId,
                        referenceMonth,
                        input.orderId
                    );
                    const totalForThreshold = monthlySum + gross;

                    // Buscar aliquota e threshold CSRF do CC (ou fallback)
                    const csrfRule = await this.getCcTaxRule(input.costCenterId, "CSRF");
                    const csrfPct = csrfRule && csrfRule.active ? Number(csrfRule.percentage) : 4.65;
                    const csrfThreshold = csrfRule && csrfRule.min_threshold != null ? Number(csrfRule.min_threshold) : THRESHOLD_CSRF;

                    if (totalForThreshold > csrfThreshold) {
                        const csrfAmount = Math.round((gross * csrfPct / 100) * 100) / 100;
                        deductions.push({ name: "CSRF (PIS/COFINS/CSLL)", amount: csrfAmount, percent: csrfPct });
                    }
                }

                if (!isMei && regimeCode !== "SIMPLES_NACIONAL" && regimeCode !== "MEI") {
                    // Buscar aliquota IRRF do CC (ou fallback)
                    const irrfRule = await this.getCcTaxRule(input.costCenterId, "IRRF_SERVICOS");
                    const irrfPct = irrfRule && irrfRule.active ? Number(irrfRule.percentage) : 1.5;
                    const irrfAmount = Math.round((gross * irrfPct / 100) * 100) / 100;
                    if (irrfAmount > 0) deductions.push({ name: "IRRF (servicos)", amount: irrfAmount, percent: irrfPct });
                }
            }
        }

        // ISS por retencao na fonte (para regimes que nao calculam ISS diretamente, ex: Lucro Real)
        // Pula se o ISS ja foi calculado (ex: Lucro Presumido inclui ISS no proprio bloco)
        const issJaCalculado = deductions.some(d => d.name === "ISS");
        if (!issJaCalculado) {
            const issRetention = (fiscalProfile.issRetentionIndicator as string) || "";
            if (issRetention === "RETEM_NA_FONTE" && gross > 0) {
                const issData = await this.getIssMunicipalityRate(costCenter);
                if (issData) {
                    const issAmount = Math.round((gross * issData.percent / 100) * 100) / 100;
                    deductions.push({ name: "ISS", amount: issAmount, percent: issData.percent });
                }
            }
        }

        const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
        const liquid = Math.max(0, gross - totalDeductions);
        return { gross, deductions, totalDeductions, liquid };
    }

    /**
     * Extrai o JSON de cnpjDetails do centro de custo.
     * Trata ambos os formatos de propriedade: cnpjDetails (camelCase) e cnpj_details (snake_case).
     */
    private parseCnpjDetails(costCenter: any): Record<string, unknown> | null {
        const raw = costCenter.cnpjDetails ?? costCenter.cnpj_details;
        if (!raw) return null;
        try {
            return typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch (_) {
            return null;
        }
    }

    /**
     * Extrai apenas o codigo do anexo (I, II, III, IV, V) de strings como "Anexo III" ou "III".
     */
    private extractAnnexCode(simplesAnexo: unknown): string {
        const raw = String(simplesAnexo || "").trim().toUpperCase();
        // Remove prefixo "ANEXO " caso exista (dropdown grava "Anexo III", tabela espera "III")
        return raw.replace(/^ANEXO\s+/, "");
    }

    /**
     * Busca a aliquota ISS do municipio vinculado ao centro de custo.
     * Retorna { percent } ou null se nao encontrar.
     */
    private async getIssMunicipalityRate(costCenter: any): Promise<{ percent: number } | null> {
        try {
            let municipality = "";
            let uf = "";
            const d = this.parseCnpjDetails(costCenter);
            if (d) {
                municipality = (d.municipality as string || "").trim();
                uf = (d.state as string || "").trim();
            }
            if (municipality && uf) {
                const IssEntity = Repository.getEntity("SasTaxIssMunicipalityEntity");
                const issRow = await Repository.findOne(IssEntity, { municipality, uf });
                if (issRow && issRow.percent != null) {
                    return { percent: Number(issRow.percent) };
                }
            }
        } catch (_) {}
        return null;
    }

    /**
     * Busca a regra pelo tax_name, primeiro na tabela por centro de custo,
     * depois na tabela global como fallback.
     */
    private async getCcTaxRule(costCenterId: string, taxName: string): Promise<any | null> {
        try {
            const CcRulesEntity = Repository.getEntity("SasCostCenterTaxRulesEntity");
            const ccRule = await Repository.findOne(CcRulesEntity, { cost_center_id: costCenterId, tax_name: taxName });
            if (ccRule) return ccRule;
        } catch (_) {}
        // Fallback: regra global
        try {
            const TaxRulesEntity = Repository.getEntity("SasTaxRulesEntity");
            const globalRule = await Repository.findOne(TaxRulesEntity, { tax_name: taxName });
            if (globalRule) return globalRule;
        } catch (_) {}
        return null;
    }

    /**
     * Busca a regra ADICIONAL_IRPJ (primeiro por CC, depois global).
     * Retorna aliquota (decimal) e limite mensal configurados no BD.
     * Caso nao encontre, usa fallback (10% / R$ 20.000).
     */
    private async getAdicionalIrpjConfig(costCenterId: string): Promise<{ rate: number; limit: number }> {
        const rule = await this.getCcTaxRule(costCenterId, "ADICIONAL_IRPJ");
        if (rule && rule.active) {
            return {
                rate: (Number(rule.percentage) || 10) / 100,
                limit: Number(rule.min_threshold) || IRPJ_ADICIONAL_LIMIT_FALLBACK
            };
        }
        return { rate: IRPJ_ADICIONAL_RATE_FALLBACK, limit: IRPJ_ADICIONAL_LIMIT_FALLBACK };
    }

    private getCurrentMonth(): string {
        const now = new Date();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const y = now.getFullYear();
        return `${y}-${m}`;
    }

    /**
     * 1) RBT12 = soma do faturamento bruto dos ultimos 12 meses (excluindo o mes de referencia).
     * Empresa nova: media dos meses existentes * 12.
     */
    private async getRBT12(costCenterId: string, referenceMonth: string): Promise<number> {
        try {
            const parts = referenceMonth.split("-").map(Number);
            if (parts.length < 2 || !parts[0] || !parts[1]) return 0;
            const [refY, refM] = parts;
            const RevenueEntity = Repository.getEntity("SasCostCenterMonthlyRevenueEntity");
            const list = await Repository.findAll(RevenueEntity, { cost_center_id: costCenterId }, []);
            const items = Array.isArray(list?.data) ? list.data : Array.isArray(list?.items) ? list.items : Array.isArray(list) ? list : [];
        const byKey = new Map<string, number>();
        for (const row of items) {
            const y = Number(row.year);
            const m = Number(row.month);
            if (y < refY || (y === refY && m < refM)) {
                byKey.set(`${y}-${String(m).padStart(2, "0")}`, Number(row.gross_revenue) || 0);
            }
        }
        const monthsNeeded: string[] = [];
        let y = refY;
        let m = refM - 1;
        for (let i = 0; i < 12; i++) {
            if (m < 1) {
                m = 12;
                y--;
            }
            monthsNeeded.push(`${y}-${String(m).padStart(2, "0")}`);
            m--;
        }
        const values = monthsNeeded.map((k) => byKey.get(k) ?? 0).filter((v) => v > 0);
        const sum = values.reduce((a, b) => a + b, 0);
        if (values.length === 0) return 0;
        if (values.length >= 12) return sum;
        return (sum / values.length) * 12;
        } catch (_) {
            return 0;
        }
    }

    /**
     * 3) Identifica a faixa do anexo em sas_simples_nacional_annex_brackets (RBT12 <= rbt12_limit).
     * Usa Repository.findAll com a entidade registrada pelo contrato.
     */
    private async getSimplesBracket(annexCode: string, rbt12: number): Promise<{ nominal_rate_percent: number; parcel_to_deduct: number } | null> {
        if (!annexCode || rbt12 <= 0) return null;
        try {
            const BracketsEntity = Repository.getEntity("SasSimplesNacionalAnnexBracketsEntity");
            const list = await Repository.findAll(BracketsEntity, { annex_code: String(annexCode).toUpperCase() }, []);
            const items = Array.isArray(list?.data) ? list.data : Array.isArray(list?.items) ? list.items : Array.isArray(list) ? list : [];
            if (!items.length) return null;

            // Ordenar por faixa crescente
            const sorted = [...items].sort((a: any, b: any) => Number(a.faixa) - Number(b.faixa));

            for (const r of sorted) {
                if (rbt12 <= Number(r.rbt12_limit)) {
                    return { nominal_rate_percent: Number(r.nominal_rate_percent), parcel_to_deduct: Number(r.parcel_to_deduct) };
                }
            }
            // Se RBT12 ultrapassa todas as faixas, usa a ultima (maior)
            const last = sorted[sorted.length - 1] as any;
            return {
                nominal_rate_percent: Number(last.nominal_rate_percent),
                parcel_to_deduct: Number(last.parcel_to_deduct)
            };
        } catch (_) {
            return null;
        }
    }

    /**
     * 2) Identificar o Anexo (CNAE/atividade) cadastrado no centro de custo.
     */
    private getSimplesAnnex(costCenter: any): string {
        const d = this.parseCnpjDetails(costCenter);
        if (!d) return "";
        return this.extractAnnexCode(d.simplesAnexo);
    }

    /**
     * Retorna mensagem explicando por que o DAS nao foi calculado (para exibir na ordem de pagamento).
     */
    private async getSimplesNacionalDasHint(
        costCenter: any,
        costCenterId: string,
        referenceMonth: string
    ): Promise<string> {
        const annexCode = this.getSimplesAnnex(costCenter);
        if (!annexCode) {
            return "Cadastre o Anexo (I a V) no centro de custo (editar empresa > dados CNPJ).";
        }
        const rbt12 = await this.getRBT12(costCenterId, referenceMonth);
        if (rbt12 <= 0) {
            return "Cadastre o faturamento mensal na Matriz Tributaria (aba Simples Nacional) para calcular o RBT12.";
        }
        const bracket = await this.getSimplesBracket(annexCode, rbt12);
        if (!bracket) {
            return `Faixa do anexo ${annexCode} nao encontrada para RBT12 R$ ${rbt12.toFixed(2)}. Verifique a tabela de faixas.`;
        }
        return "";
    }

    /**
     * Calculo do DAS (Simples Nacional) em 4 etapas:
     * 1) RBT12 = soma da receita bruta dos ultimos 12 meses (excl. mes de referencia)
     * 2) Anexo = atividade (I a V) cadastrado no centro de custo
     * 3) Faixa = tabela do anexo (RBT12 ate o limite da faixa)
     * 4) Aliquota Efetiva = ((RBT12 x Aliquota Nominal) - Parcela a Deduzir) / RBT12
     *    Imposto do mes = Receita do mes x Aliquota Efetiva
     */
    private async getSimplesNacionalDas(
        costCenter: any,
        costCenterId: string,
        gross: number,
        referenceMonth: string
    ): Promise<{ amount: number; percent: number } | null> {
        const annexCode = this.getSimplesAnnex(costCenter);
        if (!annexCode) return null;

        const rbt12 = await this.getRBT12(costCenterId, referenceMonth);
        if (rbt12 <= 0) return null;

        const bracket = await this.getSimplesBracket(annexCode, rbt12);
        if (!bracket) return null;

        const nominalPct = bracket.nominal_rate_percent / 100;
        const pd = bracket.parcel_to_deduct;
        const effectiveRate = ((rbt12 * nominalPct) - pd) / rbt12;
        const effectivePct = Math.max(0, Math.min(1, effectiveRate)) * 100;
        const amount = Math.round(gross * (effectivePct / 100) * 100) / 100;
        return { amount, percent: Math.round(effectivePct * 100) / 100 };
    }

    /**
     * Tabela progressiva IRRF simplificada (base Receita Federal - faixas mensais).
     * Valor x Aliquota - Parcela a deduzir.
     */
    private irrfProgressive(gross: number): number {
        const faixas = [
            { limite: 2112.00, aliquota: 0, deduzir: 0 },
            { limite: 2826.65, aliquota: 0.075, deduzir: 158.40 },
            { limite: 3751.05, aliquota: 0.15, deduzir: 370.40 },
            { limite: 4664.68, aliquota: 0.225, deduzir: 651.73 },
            { limite: Infinity, aliquota: 0.275, deduzir: 884.96 }
        ];
        for (const f of faixas) {
            if (gross <= f.limite) {
                return Math.max(0, gross * f.aliquota - f.deduzir);
            }
        }
        return 0;
    }
}
