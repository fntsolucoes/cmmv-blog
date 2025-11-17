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

        // Normalizar datas de início e fim do mês
        const startDate = new Date(year, month - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Filtrar ordens do mês especificado
        const orders = (allOrders?.data || []).filter((order: any) => {
            if (!order.effectivePaymentDate) return false;
            const paymentDate = new Date(order.effectivePaymentDate);
            paymentDate.setHours(0, 0, 0, 0);
            return paymentDate >= startDate && paymentDate <= endDate;
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
            const netAmount = order.invoiceAmount - order.taxAmount;
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
            if (order.currency === 'USD' && order.effectivePaymentDate) {
                const usdRate = await this.getExchangeRate('USD-BRL', new Date(order.effectivePaymentDate));
                if (usdRate) {
                    const netAmount = order.invoiceAmount - order.taxAmount;
                    totalBRL += netAmount * Number(usdRate.rate);
                }
            } else if (order.currency === 'EUR' && order.effectivePaymentDate) {
                const eurRate = await this.getExchangeRate('EUR-BRL', new Date(order.effectivePaymentDate));
                if (eurRate) {
                    const netAmount = order.invoiceAmount - order.taxAmount;
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

        // Normalizar data para comparação
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // Encontrar a taxa mais recente que seja <= data especificada
        for (const rate of allRates.data) {
            const rateDate = new Date(rate.date);
            rateDate.setHours(0, 0, 0, 0);
            if (rateDate <= targetDate) {
                return rate;
            }
        }

        return null;
    }
}

