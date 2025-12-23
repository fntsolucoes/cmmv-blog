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

        if (!shareholders?.data || shareholders.data.length === 0) {
            return {
                year,
                month,
                totalByCurrency: {},
                totalBRL: 0,
                distribution: [],
                ordersCount: 0
            };
        }

        // Agrupar por moeda e calcular totais
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

        // Converter para BRL se necessário
        // Para cada ordem, buscar a taxa de câmbio na data do pagamento
        let totalBRL = totalsByCurrency['BRL'] || 0;

        // Converter USD e EUR para BRL usando a taxa de cada ordem
        for (const order of orders) {
            // Desconto também está na mesma moeda da ordem
            const discountAmount = order.discountAmount ?? 0;
            let netAmount = order.invoiceAmount - order.taxAmount - discountAmount;
            
            if (netAmount < 0) {
                netAmount = 0;
            }

            if (order.currency === 'USD' && order.effectivePaymentDate) {
                const usdRate = await this.getExchangeRate('USD-BRL', new Date(order.effectivePaymentDate));
                if (usdRate) {
                    totalBRL += netAmount * Number(usdRate.rate);
                }
            } else if (order.currency === 'EUR' && order.effectivePaymentDate) {
                const eurRate = await this.getExchangeRate('EUR-BRL', new Date(order.effectivePaymentDate));
                if (eurRate) {
                    totalBRL += netAmount * Number(eurRate.rate);
                }
            }
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
            distribution,
            ordersCount: orders.length
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

