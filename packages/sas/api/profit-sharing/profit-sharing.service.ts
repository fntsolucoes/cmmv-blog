import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class ProfitSharingService {
    /**
     * Calcular divisão de lucros por mês
     */
    async calculateMonthlyProfitSharing(year: number, month: number) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const ShareholdersEntity = Repository.getEntity("SasShareholdersEntity");

        // Buscar todas as ordens pagas (filtrar por data depois)
        const allOrders = await Repository.findAll(PaymentOrdersEntity, {
            status: 'Pago',
            limit: 10000
        }, []);

        // Notas em aberto do periodo (status Pendente e expectedPaymentMonth = mes selecionado)
        const expectedMonthStr = `${year}-${String(month).padStart(2, '0')}`;
        const openOrdersRes = await Repository.findAll(PaymentOrdersEntity, {
            status: 'Pendente',
            limit: 10000
        }, []);
        const openOrdersList = Array.isArray(openOrdersRes?.data) ? openOrdersRes.data : [];
        const ordersCountOpen = openOrdersList.filter((o: any) => (o.expectedPaymentMonth || '') === expectedMonthStr).length;

        // Filtrar ordens do mês especificado
        // Usar UTC para consistência com as datas armazenadas no backend
        // REGRA: Se finalizedForProfitSharingAt existir, usar ele para determinar o mês de referência
        // Se não existir (ordens antigas), usar effectivePaymentDate para alocar no mês certo
        // REGRA ESPECIAL: Se uma ordem foi RECÉM finalizada (finalizedForProfitSharingAt preenchido no mês atual)
        // e tem data retroativa (mês anterior), ela deve ir para o mês atual (aberto), não para o mês da data retroativa
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth() + 1;
        
        // Verificar se estamos calculando o mês atual (aberto) ou um mês já fechado
        const isCurrentMonth = (year === currentYear && month === currentMonth);
        
        const orders = (allOrders?.data || []).filter((order: any) => {
            if (!order.effectivePaymentDate) {
                return false;
            }
            
            const paymentDate = new Date(order.effectivePaymentDate);
            const paymentYear = paymentDate.getUTCFullYear();
            const paymentMonth = paymentDate.getUTCMonth() + 1;
            
            // Verificar se a ordem tem data retroativa (mês anterior ao atual)
            const isRetroactive = (paymentYear < currentYear) || 
                                  (paymentYear === currentYear && paymentMonth < currentMonth);
            
            // Se a ordem tem finalizedForProfitSharingAt (ordem nova com controle de finalização)
            if (order.finalizedForProfitSharingAt) {
                const finalizedDate = new Date(order.finalizedForProfitSharingAt);
                const finalizedYear = finalizedDate.getUTCFullYear();
                const finalizedMonth = finalizedDate.getUTCMonth() + 1;
                
                // Verificar se foi finalizada no mês atual (ordem nova recém marcada como paga)
                const isRecentlyFinalized = (finalizedYear === currentYear && finalizedMonth === currentMonth);
                
                // Se a ordem foi finalizada recentemente (mês atual) e tem data retroativa,
                // ela NÃO deve aparecer no mês da data retroativa, apenas no mês atual
                if (isRetroactive && isRecentlyFinalized) {
                    // Ordem retroativa recém finalizada: só considerar no mês atual (aberto)
                    return isCurrentMonth; // Só aparece no mês atual, não no mês da data retroativa
                }
                
                // Para outras ordens finalizadas, usar effectivePaymentDate para determinar o mês
                return paymentYear === year && paymentMonth === month;
            } else {
                // Ordem antiga sem finalizedForProfitSharingAt: usar effectivePaymentDate para determinar o mês
                // (comportamento antigo - alocar pelo mês da data de pagamento)
                return paymentYear === year && paymentMonth === month;
            }
        });

        // Buscar sócios ativos
        const shareholders = await Repository.findAll(ShareholdersEntity, {
            active: true,
            limit: 100
        }, []);

        // Total gasto em imposto por centro de custo (para exibição na divisão mensal)
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

        // Total bruto do periodo: com imposto (taxAmount > 0) e sem imposto (taxAmount = 0)
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

        // Converter USD e EUR para BRL (usar ultimo dia do mes como data da taxa)
        const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const rateDate = new Date(Date.UTC(year, month - 1, lastDayOfMonth, 12, 0, 0, 0)); // month 1-12 -> index 0-11
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

        if (!shareholders?.data || shareholders.data.length === 0) {
            return {
                year,
                month,
                totalByCurrency: {},
                totalBRL: 0,
                totalGrossWithTaxByCurrency,
                totalGrossWithoutTaxByCurrency,
                totalGrossWithTaxUsdInBRL,
                totalGrossWithTaxEurInBRL,
                totalGrossWithoutTaxUsdInBRL,
                totalGrossWithoutTaxEurInBRL,
                totalGrossFinalBRL,
                totalTaxByCostCenter,
                distribution: [],
                ordersCount: orders.length,
                ordersCountOpen
            };
        }

        // Agrupar por moeda e calcular totais (para exibição)
        const totalsByCurrency: Record<string, number> = {};
        
        for (const order of orders) {
            // Considerar também o desconto (mesma moeda da fatura)
            const discountAmount = order.discountAmount ?? 0;
            let netAmount = order.invoiceAmount - order.taxAmount - discountAmount;
            
            // Garantir que não fique negativo por dados antigos inconsistentes
            if (netAmount < 0) {
                netAmount = 0;
            }

            if (!totalsByCurrency[order.currency]) {
                totalsByCurrency[order.currency] = 0;
            }
            totalsByCurrency[order.currency] += netAmount;
        }

        // Calcular total em BRL usando paidValue diretamente (igual ao dashboard)
        // paidValue já está em BRL e foi calculado quando a ordem foi marcada como paga
        let totalBRL = 0;
        for (const order of orders) {
            // Usar paidValue diretamente, que já está em BRL
            const value = order.paidValue || 0;
            totalBRL += value;
        }

        // Calcular divisão por sócio
        const distribution = shareholders.data.map((sh: any) => ({
            shareholderId: sh.id,
            shareholderName: sh.name,
            percentage: sh.percentage,
            amount: (totalBRL * sh.percentage) / 100
        }));

        return {
            year,
            month,
            totalByCurrency: totalsByCurrency,
            totalBRL,
            totalGrossWithTaxByCurrency,
            totalGrossWithoutTaxByCurrency,
            totalGrossWithTaxUsdInBRL,
            totalGrossWithTaxEurInBRL,
            totalGrossWithoutTaxUsdInBRL,
            totalGrossWithoutTaxEurInBRL,
            totalGrossFinalBRL,
            totalTaxByCostCenter,
            distribution,
            ordersCount: orders.length,
            ordersCountOpen
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

