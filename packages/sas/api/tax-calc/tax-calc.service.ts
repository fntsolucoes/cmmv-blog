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
        if (costCenter.fiscal_profile) {
            try {
                fiscalProfile = typeof costCenter.fiscal_profile === "string"
                    ? JSON.parse(costCenter.fiscal_profile) : costCenter.fiscal_profile;
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
            const regime = costCenter.tax_regime_id
                ? await Repository.findOne(TaxRegimesEntity, { id: costCenter.tax_regime_id })
                : null;
            const regimeCode = (regime?.code as string) || "";
            const isMei = costCenter.is_mei_optant === true || costCenter.is_mei_optant === 1;

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

                const pisAmount = Math.round((gross * 0.0065) * 100) / 100;
                if (pisAmount > 0) deductions.push({ name: "PIS", amount: pisAmount, percent: 0.65 });

                const cofinsAmount = Math.round((gross * 0.03) * 100) / 100;
                if (cofinsAmount > 0) deductions.push({ name: "COFINS", amount: cofinsAmount, percent: 3 });

                const csllPctOnGross = Math.round(presumptionRate * 0.09 * 10000) / 100; // ex: 0.32*0.09 = 2.88%
                const csllAmount = Math.round((orderBaseIR * 0.09) * 100) / 100;
                if (csllAmount > 0) deductions.push({ name: "CSLL", amount: csllAmount, percent: csllPctOnGross });

                // Buscar regra ADICIONAL_IRPJ do banco para aliquota e limite configuravel
                const adicionalConfig = await this.getAdicionalIrpjConfig();

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
            } else {
                const aplicaCsrf = !isMei && (regimeCode === "LUCRO_REAL" || regimeCode === "LUCRO_PRESUMIDO");
                if (aplicaCsrf) {
                    const monthlySum = await this.getMonthlySumForCostCenter(
                        input.costCenterId,
                        referenceMonth,
                        input.orderId
                    );
                    const totalForThreshold = monthlySum + gross;
                    if (totalForThreshold > THRESHOLD_CSRF) {
                        const csrfAmount = Math.round((gross * 0.0465) * 100) / 100;
                        deductions.push({ name: "CSRF (PIS/COFINS/CSLL)", amount: csrfAmount, percent: 4.65 });
                    }
                }

                if (!isMei && regimeCode !== "SIMPLES_NACIONAL" && regimeCode !== "MEI") {
                    const irrfAmount = Math.round((gross * 0.015) * 100) / 100;
                    if (irrfAmount > 0) deductions.push({ name: "IRRF (servicos)", amount: irrfAmount, percent: 1.5 });
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
     * Busca a aliquota ISS do municipio vinculado ao centro de custo.
     * Retorna { percent } ou null se nao encontrar.
     */
    private async getIssMunicipalityRate(costCenter: any): Promise<{ percent: number } | null> {
        try {
            let municipality = "";
            let uf = "";
            if (costCenter.cnpjDetails) {
                const d = typeof costCenter.cnpjDetails === "string"
                    ? JSON.parse(costCenter.cnpjDetails) : costCenter.cnpjDetails;
                municipality = (d.municipality || "").trim();
                uf = (d.state || "").trim();
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
     * Busca a regra ADICIONAL_IRPJ na tabela sas_tax_rules.
     * Retorna aliquota (decimal) e limite mensal configurados no BD.
     * Caso nao encontre, usa fallback (10% / R$ 20.000).
     */
    private async getAdicionalIrpjConfig(): Promise<{ rate: number; limit: number }> {
        try {
            const TaxRulesEntity = Repository.getEntity("SasTaxRulesEntity");
            const rule = await Repository.findOne(TaxRulesEntity, { tax_name: "ADICIONAL_IRPJ" });
            if (rule && rule.active) {
                return {
                    rate: (Number(rule.percentage) || 10) / 100,
                    limit: Number(rule.min_threshold) || IRPJ_ADICIONAL_LIMIT_FALLBACK
                };
            }
        } catch (_) {}
        return { rate: IRPJ_ADICIONAL_RATE_FALLBACK, limit: IRPJ_ADICIONAL_LIMIT_FALLBACK };
    }

    private getCurrentMonth(): string {
        const now = new Date();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const y = now.getFullYear();
        return `${y}-${m}`;
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
