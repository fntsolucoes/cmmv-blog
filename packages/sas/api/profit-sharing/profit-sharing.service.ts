import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

const IRPJ_ADICIONAL_RATE_FALLBACK = 0.10;
const IRPJ_ADICIONAL_MONTHLY_LIMIT_FALLBACK = 20000;
const IRPJ_ADICIONAL_QUARTERLY_LIMIT = 60000;
const DEFAULT_PRESUMPTION_RATE = 32;

export interface IrpjAdicionalInfo {
    isQuarterEnd: boolean;
    quarter: number;
    quarterMonths: number[];
    presumptionRate: number;
    grossLucroPresumido: number;
    presumidoMensal: number;
    irpjAdicionalMensalCalculado: number;
    irpjAdicionalJaDescontadoNoMes: number;
    irpjAdicionalDiferencaMensal: number;
    grossTrimestral: number;
    presumidoTrimestral: number;
    irpjAdicionalTrimestreReal: number;
    irpjAdicionalJaDescontadoTrimestre: number;
    irpjAdicionalDiferencaTrimestre: number;
    ajusteFinalTrimestre: number;
    costCentersLucroPresumido: Array<{ id: string; name: string; regimeStartDate: string | null }>;
}

@Service()
export class ProfitSharingService {
    /**
     * Retorna os meses (ano/mês) que possuem ordens pagas (mesma regra do resumo), ordenados cronologicamente.
     */
    async getAvailableMonths() {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const allOrders = await Repository.findAll(PaymentOrdersEntity, {
            status: 'Pago',
            limit: 10000
        }, []);
        const ordersList = allOrders?.data || [];
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth() + 1;
        const keys = new Set<string>();
        for (const order of ordersList as any[]) {
            if (!order.effectivePaymentDate) continue;
            const paymentDate = new Date(order.effectivePaymentDate);
            const paymentYear = paymentDate.getUTCFullYear();
            const paymentMonth = paymentDate.getUTCMonth() + 1;
            const isRetroactive = (paymentYear < currentYear) ||
                (paymentYear === currentYear && paymentMonth < currentMonth);
            let year: number;
            let month: number;
            if (order.finalizedForProfitSharingAt) {
                const finalizedDate = new Date(order.finalizedForProfitSharingAt);
                const finalizedYear = finalizedDate.getUTCFullYear();
                const finalizedMonth = finalizedDate.getUTCMonth() + 1;
                const isRecentlyFinalized = (finalizedYear === currentYear && finalizedMonth === currentMonth);
                if (isRetroactive && isRecentlyFinalized) {
                    year = currentYear;
                    month = currentMonth;
                } else {
                    year = paymentYear;
                    month = paymentMonth;
                }
            } else {
                year = paymentYear;
                month = paymentMonth;
            }
            keys.add(`${year}-${String(month).padStart(2, '0')}`);
        }
        const list = Array.from(keys).sort().map((key) => {
            const [y, m] = key.split('-').map(Number);
            return { year: y, month: m };
        });
        return { data: list };
    }

    /**
     * Retorna as ordens de pagamento do mês (mesma regra do resumo mensal), com nome do parceiro comercial.
     */
    async getMonthlyOrders(year: number, month: number) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const allOrders = await Repository.findAll(PaymentOrdersEntity, {
            status: 'Pago',
            limit: 10000
        }, []);
        const orders = this.filterOrdersByMonth(allOrders?.data || [], year, month);

        const partnerIds = [...new Set((orders as any[]).map((o: any) => o.commercialPartnerId).filter(Boolean))];
        const partnerNameById: Record<string, string> = {};
        if (partnerIds.length > 0) {
            const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
            const partnersRes = await Repository.findAll(CommercialPartnersEntity, { limit: 10000 }, []);
            const partnersList = partnersRes?.data || [];
            for (const p of partnersList as any[]) {
                if (p.id && partnerIds.includes(p.id)) partnerNameById[p.id] = p.name || p.id;
            }
        }

        const enriched = (orders as any[]).map((o: any) => ({
            ...o,
            commercialPartnerName: (o.commercialPartnerId && partnerNameById[o.commercialPartnerId]) || '-'
        }));
        enriched.sort((a: any, b: any) =>
            (a.commercialPartnerName || '').localeCompare(b.commercialPartnerName || '', 'pt-BR')
        );
        return { data: enriched };
    }

    private filterOrdersByMonth(ordersList: any[], year: number, month: number): any[] {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth() + 1;
        const isCurrentMonth = (year === currentYear && month === currentMonth);

        return ordersList.filter((order: any) => {
            if (!order.effectivePaymentDate) return false;
            const paymentDate = new Date(order.effectivePaymentDate);
            const paymentYear = paymentDate.getUTCFullYear();
            const paymentMonth = paymentDate.getUTCMonth() + 1;
            const isRetroactive = (paymentYear < currentYear) ||
                (paymentYear === currentYear && paymentMonth < currentMonth);

            if (order.finalizedForProfitSharingAt) {
                const finalizedDate = new Date(order.finalizedForProfitSharingAt);
                const finalizedYear = finalizedDate.getUTCFullYear();
                const finalizedMonth = finalizedDate.getUTCMonth() + 1;
                const isRecentlyFinalized = (finalizedYear === currentYear && finalizedMonth === currentMonth);
                if (isRetroactive && isRecentlyFinalized) return isCurrentMonth;
                return paymentYear === year && paymentMonth === month;
            }
            return paymentYear === year && paymentMonth === month;
        });
    }

    /**
     * Calcular divisão de lucros por mês
     */
    async calculateMonthlyProfitSharing(year: number, month: number) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const ShareholdersEntity = Repository.getEntity("SasShareholdersEntity");

        const allOrders = await Repository.findAll(PaymentOrdersEntity, {
            status: 'Pago',
            limit: 10000
        }, []);

        const expectedMonthStr = `${year}-${String(month).padStart(2, '0')}`;
        const openOrdersRes = await Repository.findAll(PaymentOrdersEntity, {
            status: 'Pendente',
            limit: 10000
        }, []);
        const openOrdersList = Array.isArray(openOrdersRes?.data) ? openOrdersRes.data : [];
        const ordersCountOpen = openOrdersList.filter((o: any) => (o.expectedPaymentMonth || '') === expectedMonthStr).length;

        const orders = this.filterOrdersByMonth(allOrders?.data || [], year, month);

        const shareholders = await Repository.findAll(ShareholdersEntity, {
            active: true,
            limit: 100
        }, []);

        const taxByCostCenterId: Record<string, number> = {};
        for (const order of orders) {
            const costCenterId = order.costCenterId || '';
            if (!costCenterId) continue;
            const tax = order.taxAmount ?? 0;
            taxByCostCenterId[costCenterId] = (taxByCostCenterId[costCenterId] || 0) + tax;
        }
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");
        const costCentersRes = await Repository.findAll(CostCentersEntity, { limit: 500 }, []);
        const costCentersList = costCentersRes?.data || [];
        const totalTaxByCostCenter = Object.entries(taxByCostCenterId).map(([costCenterId, taxAmount]) => {
            const cc = costCentersList.find((c: any) => c.id === costCenterId);
            return {
                costCenterId,
                costCenterName: cc?.name || costCenterId,
                taxAmount
            };
        });

        const totalGrossWithTaxByCurrency: Record<string, number> = {};
        const totalGrossWithoutTaxByCurrency: Record<string, number> = {};
        for (const order of orders) {
            const gross = order.invoiceAmount ?? 0;
            const hasTax = (order.taxAmount ?? 0) > 0;
            const target = hasTax ? totalGrossWithTaxByCurrency : totalGrossWithoutTaxByCurrency;
            if (!target[order.currency]) {
                target[order.currency] = 0;
            }
            target[order.currency] += gross;
        }

        const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const rateDate = new Date(Date.UTC(year, month - 1, lastDayOfMonth, 12, 0, 0, 0));
        const rateUsd = await this.getExchangeRate('USD-BRL', rateDate);
        const rateEur = await this.getExchangeRate('EUR-BRL', rateDate);
        const usdToBrl = rateUsd?.rate ? Number(rateUsd.rate) : 0;
        const eurToBrl = rateEur?.rate ? Number(rateEur.rate) : 0;

        const totalGrossWithTaxUsdInBRL = (totalGrossWithTaxByCurrency['USD'] ?? 0) * usdToBrl;
        const totalGrossWithTaxEurInBRL = (totalGrossWithTaxByCurrency['EUR'] ?? 0) * eurToBrl;
        const totalGrossWithoutTaxUsdInBRL = (totalGrossWithoutTaxByCurrency['USD'] ?? 0) * usdToBrl;
        const totalGrossWithoutTaxEurInBRL = (totalGrossWithoutTaxByCurrency['EUR'] ?? 0) * eurToBrl;

        const totalGrossFinalBRL =
            (totalGrossWithTaxByCurrency['BRL'] ?? 0) +
            (totalGrossWithoutTaxByCurrency['BRL'] ?? 0) +
            totalGrossWithTaxUsdInBRL +
            totalGrossWithTaxEurInBRL +
            totalGrossWithoutTaxUsdInBRL +
            totalGrossWithoutTaxEurInBRL;

        // IRPJ Adicional consolidado
        const allOrdersList = allOrders?.data || [];
        const irpjAdicional = await this.calculateIrpjAdicionalConsolidado(
            year, month, orders, allOrdersList, costCentersList
        );

        const emptyResult = {
            year,
            month,
            totalByCurrency: {} as Record<string, number>,
            totalBRL: 0,
            totalGrossWithTaxByCurrency,
            totalGrossWithoutTaxByCurrency,
            totalGrossWithTaxUsdInBRL,
            totalGrossWithTaxEurInBRL,
            totalGrossWithoutTaxUsdInBRL,
            totalGrossWithoutTaxEurInBRL,
            totalGrossFinalBRL,
            totalTaxByCostCenter,
            irpjAdicional,
            distribution: [] as any[],
            ordersCount: orders.length,
            ordersCountOpen
        };

        if (!shareholders?.data || shareholders.data.length === 0) {
            return emptyResult;
        }

        const totalsByCurrency: Record<string, number> = {};
        
        for (const order of orders) {
            const discountAmount = order.discountAmount ?? 0;
            let netAmount = order.invoiceAmount - order.taxAmount - discountAmount;
            
            if (netAmount < 0) {
                netAmount = 0;
            }

            if (!totalsByCurrency[order.currency]) {
                totalsByCurrency[order.currency] = 0;
            }
            totalsByCurrency[order.currency] += netAmount;
        }

        let totalBRL = 0;
        for (const order of orders) {
            const value = order.paidValue || 0;
            totalBRL += value;
        }

        // Ajustar totalBRL pelo IRPJ Adicional consolidado
        const irpjAjuste = irpjAdicional.ajusteFinalTrimestre;
        // ajusteFinalTrimestre > 0: precisa descontar mais (diminui lucro)
        // ajusteFinalTrimestre < 0: precisa devolver (aumenta lucro)
        totalBRL -= irpjAjuste;

        const distribution = shareholders.data.map((sh: any) => ({
            shareholderId: sh.id,
            shareholderName: sh.name,
            percentage: sh.percentage,
            amount: Math.round(((totalBRL * sh.percentage) / 100) * 100) / 100
        }));

        return {
            year,
            month,
            totalByCurrency: totalsByCurrency,
            totalBRL: Math.round(totalBRL * 100) / 100,
            totalGrossWithTaxByCurrency,
            totalGrossWithoutTaxByCurrency,
            totalGrossWithTaxUsdInBRL,
            totalGrossWithTaxEurInBRL,
            totalGrossWithoutTaxUsdInBRL,
            totalGrossWithoutTaxEurInBRL,
            totalGrossFinalBRL,
            totalTaxByCostCenter,
            irpjAdicional,
            distribution,
            ordersCount: orders.length,
            ordersCountOpen
        };
    }

    /**
     * Identifica centros de custo com regime Lucro Presumido.
     */
    private async getLucroPresumidoCostCenters(costCentersList: any[]): Promise<any[]> {
        const TaxRegimesEntity = Repository.getEntity("SasTaxRegimesEntity");
        const regimesRes = await Repository.findAll(TaxRegimesEntity, { limit: 100 }, []);
        const regimesList = regimesRes?.data || [];
        const presumidoRegime = regimesList.find((r: any) => r.code === "LUCRO_PRESUMIDO");
        if (!presumidoRegime) return [];

        return costCentersList.filter((cc: any) => {
            const regimeId = cc.tax_regime_id ?? cc.taxRegimeId;
            if (regimeId !== presumidoRegime.id) return false;
            const isMei = cc.is_mei_optant === true || cc.is_mei_optant === 1
                || cc.isMeiOptant === true || cc.isMeiOptant === 1;
            return !isMei;
        });
    }

    /**
     * Extrai a data de inicio do regime tributario do cnpjDetails do centro de custo.
     * Retorna null se nao estiver cadastrada.
     */
    private getRegimeStartDate(cc: any): Date | null {
        const raw = cc.cnpjDetails ?? cc.cnpj_details;
        if (!raw) return null;
        try {
            const d = typeof raw === "string" ? JSON.parse(raw) : raw;
            const dateStr = d.regimeStartDate;
            if (!dateStr) return null;
            const parsed = new Date(dateStr);
            if (isNaN(parsed.getTime())) return null;
            return parsed;
        } catch (_) {}
        return null;
    }

    /**
     * Verifica se uma ordem de pagamento esta dentro do periodo do regime,
     * ou seja, a effectivePaymentDate >= regimeStartDate do CC.
     */
    private isOrderAfterRegimeStart(order: any, regimeStartByCC: Map<string, Date | null>): boolean {
        const ccId = order.costCenterId;
        const startDate = regimeStartByCC.get(ccId);
        if (!startDate) return true;
        const paymentDate = order.effectivePaymentDate
            ? new Date(order.effectivePaymentDate)
            : null;
        if (!paymentDate) return true;
        return paymentDate >= startDate;
    }

    /**
     * Verifica se a ordem foi calculada pelo motor tributario.
     */
    private hasTaxEngine(order: any): boolean {
        const v = order.tax_engine_used ?? order.taxEngineUsed;
        return v === true || v === 1;
    }

    /**
     * Extrai a taxa de presuncao do centro de custo (default 32%).
     */
    private getPresumptionRate(cc: any): number {
        const raw = cc.fiscal_profile ?? cc.fiscalProfile;
        if (!raw) return DEFAULT_PRESUMPTION_RATE / 100;
        try {
            const fp = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (fp.presumptionRate != null && fp.presumptionRate !== "") {
                const pct = Math.min(100, Math.max(0, Number(fp.presumptionRate)));
                return pct / 100;
            }
        } catch (_) {}
        return DEFAULT_PRESUMPTION_RATE / 100;
    }

    /**
     * Busca a regra ADICIONAL_IRPJ (por CC, depois global).
     */
    private async getAdicionalIrpjConfig(): Promise<{ rate: number; limit: number }> {
        try {
            const TaxRulesEntity = Repository.getEntity("SasTaxRulesEntity");
            const rule = await Repository.findOne(TaxRulesEntity, { tax_name: "ADICIONAL_IRPJ" });
            if (rule && rule.active) {
                return {
                    rate: (Number(rule.percentage) || 10) / 100,
                    limit: Number(rule.min_threshold) || IRPJ_ADICIONAL_MONTHLY_LIMIT_FALLBACK
                };
            }
        } catch (_) {}
        return { rate: IRPJ_ADICIONAL_RATE_FALLBACK, limit: IRPJ_ADICIONAL_MONTHLY_LIMIT_FALLBACK };
    }

    /**
     * Calcula o IRPJ Adicional consolidado para o mes/trimestre.
     *
     * Regras:
     * - Soma o bruto de todas as ordens de CCs lucro presumido no mes
     * - Calcula o valor presumido (bruto * taxa de presuncao)
     * - Calcula o IRPJ adicional mensal: (presumido - limite_mensal) * 10% se exceder
     * - Abate os irpj_adicional_amount ja calculados nas ordens individuais
     * - No final do trimestre (meses 3, 6, 9, 12): faz balanco trimestral
     *   - Se presumido trimestral > R$ 60.000: IRPJ real = (presumido - 60.000) * 10%
     *   - Se <= R$ 60.000: devolve tudo retido
     *   - Calcula diferenca entre real e ja descontado
     */
    async calculateIrpjAdicionalConsolidado(
        year: number,
        month: number,
        ordersDoMes: any[],
        allPaidOrders: any[],
        costCentersList: any[]
    ): Promise<IrpjAdicionalInfo> {
        const quarter = Math.ceil(month / 3);
        const quarterMonths = [
            (quarter - 1) * 3 + 1,
            (quarter - 1) * 3 + 2,
            (quarter - 1) * 3 + 3
        ];
        const isQuarterEnd = month === quarterMonths[2];

        const ccList = await this.getLucroPresumidoCostCenters(costCentersList);
        const ccIds = new Set(ccList.map((cc: any) => cc.id));

        const regimeStartByCC = new Map<string, Date | null>();
        const costCentersLucroPresumido = ccList.map((cc: any) => {
            const startDate = this.getRegimeStartDate(cc);
            regimeStartByCC.set(cc.id, startDate);
            return {
                id: cc.id,
                name: cc.name || cc.id,
                regimeStartDate: startDate ? startDate.toISOString() : null
            };
        });

        if (ccIds.size === 0) {
            return {
                isQuarterEnd,
                quarter,
                quarterMonths,
                presumptionRate: DEFAULT_PRESUMPTION_RATE,
                grossLucroPresumido: 0,
                presumidoMensal: 0,
                irpjAdicionalMensalCalculado: 0,
                irpjAdicionalJaDescontadoNoMes: 0,
                irpjAdicionalDiferencaMensal: 0,
                grossTrimestral: 0,
                presumidoTrimestral: 0,
                irpjAdicionalTrimestreReal: 0,
                irpjAdicionalJaDescontadoTrimestre: 0,
                irpjAdicionalDiferencaTrimestre: 0,
                ajusteFinalTrimestre: 0,
                costCentersLucroPresumido
            };
        }

        const presumptionRate = this.getPresumptionRate(ccList[0]);
        const config = await this.getAdicionalIrpjConfig();

        // Filtrar ordens do mes: CC lucro presumido + motor tributario + posteriores ao inicio do regime
        const ordersLP = ordersDoMes.filter((o: any) =>
            ccIds.has(o.costCenterId)
            && this.hasTaxEngine(o)
            && this.isOrderAfterRegimeStart(o, regimeStartByCC)
        );
        let grossMensal = 0;
        let irpjJaDescontadoMes = 0;
        for (const o of ordersLP) {
            grossMensal += Number(o.invoiceAmount) || 0;
            irpjJaDescontadoMes += Number(o.irpj_adicional_amount ?? o.irpjAdicionalAmount ?? 0);
        }

        const presumidoMensal = Math.round(grossMensal * presumptionRate * 100) / 100;
        const irpjMensalCalculado = Math.round(
            Math.max(0, (presumidoMensal - config.limit) * config.rate) * 100
        ) / 100;
        const diferencaMensal = Math.round(
            Math.max(0, irpjMensalCalculado - irpjJaDescontadoMes) * 100
        ) / 100;

        // Calcular trimestre: somar somente ordens posteriores ao inicio do regime
        let grossTrimestral = 0;
        let irpjJaDescontadoTrimestre = 0;

        for (const qMonth of quarterMonths) {
            const ordersOfMonth = this.filterOrdersByMonth(allPaidOrders, year, qMonth);
            const ordersLPMonth = ordersOfMonth.filter((o: any) =>
                ccIds.has(o.costCenterId)
                && this.hasTaxEngine(o)
                && this.isOrderAfterRegimeStart(o, regimeStartByCC)
            );
            for (const o of ordersLPMonth) {
                grossTrimestral += Number(o.invoiceAmount) || 0;
                irpjJaDescontadoTrimestre += Number(o.irpj_adicional_amount ?? o.irpjAdicionalAmount ?? 0);
            }
        }

        const presumidoTrimestral = Math.round(grossTrimestral * presumptionRate * 100) / 100;
        const irpjTrimestreReal = Math.round(
            Math.max(0, (presumidoTrimestral - IRPJ_ADICIONAL_QUARTERLY_LIMIT) * config.rate) * 100
        ) / 100;
        const diferencaTrimestre = Math.round(
            (irpjTrimestreReal - irpjJaDescontadoTrimestre) * 100
        ) / 100;

        // Ajuste final: no final do trimestre usa o balanco trimestral; senao usa o mensal
        let ajusteFinal: number;
        if (isQuarterEnd) {
            ajusteFinal = diferencaTrimestre;
        } else {
            ajusteFinal = diferencaMensal;
        }

        return {
            isQuarterEnd,
            quarter,
            quarterMonths,
            presumptionRate: Math.round(presumptionRate * 100 * 100) / 100,
            grossLucroPresumido: Math.round(grossMensal * 100) / 100,
            presumidoMensal,
            irpjAdicionalMensalCalculado: irpjMensalCalculado,
            irpjAdicionalJaDescontadoNoMes: Math.round(irpjJaDescontadoMes * 100) / 100,
            irpjAdicionalDiferencaMensal: diferencaMensal,
            grossTrimestral: Math.round(grossTrimestral * 100) / 100,
            presumidoTrimestral,
            irpjAdicionalTrimestreReal: irpjTrimestreReal,
            irpjAdicionalJaDescontadoTrimestre: Math.round(irpjJaDescontadoTrimestre * 100) / 100,
            irpjAdicionalDiferencaTrimestre: diferencaTrimestre,
            ajusteFinalTrimestre: Math.round(ajusteFinal * 100) / 100,
            costCentersLucroPresumido
        };
    }

    private async getExchangeRate(currencyPair: string, date: Date) {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        
        // Buscar todas as taxas da moeda e filtrar manualmente
        const allRates = await Repository.findAll(ExchangeRatesEntity, {
            currencyPair,
            limit: 1000
        }, [], {
            order: {
                date: 'DESC'
            }
        });

        if (!allRates?.data) {
            return null;
        }

        // Normalizar data para comparação usando UTC
        const targetYear = date.getUTCFullYear();
        const targetMonth = date.getUTCMonth();
        const targetDay = date.getUTCDate();
        const targetDateUTC = new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));

        // Encontrar a taxa mais recente que seja <= data especificada
        for (const rate of allRates.data) {
            const rateDate = new Date(rate.date);
            const rateYear = rateDate.getUTCFullYear();
            const rateMonth = rateDate.getUTCMonth();
            const rateDay = rateDate.getUTCDate();
            const rateDateUTC = new Date(Date.UTC(rateYear, rateMonth, rateDay, 0, 0, 0, 0));
            if (rateDateUTC <= targetDateUTC) {
                return rate;
            }
        }

        return null;
    }
}

