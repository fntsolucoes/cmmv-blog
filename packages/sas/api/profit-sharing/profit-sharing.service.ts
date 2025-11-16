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
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");

        // Buscar todas as ordens pagas no mês
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const orders = await Repository.findAll(PaymentOrdersEntity, {
            where: {
                status: 'Pago',
                effectivePaymentDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            },
            limit: 10000
        });

        // Buscar sócios ativos
        const shareholders = await Repository.findAll(ShareholdersEntity, {
            where: { active: true },
            limit: 100
        });

        // Agrupar por moeda e calcular totais
        const totalsByCurrency: Record<string, number> = {};
        
        for (const order of orders.data) {
            const netAmount = order.invoiceAmount - order.taxAmount;
            if (!totalsByCurrency[order.currency]) {
                totalsByCurrency[order.currency] = 0;
            }
            totalsByCurrency[order.currency] += netAmount;
        }

        // Converter para BRL se necessário
        // Para cada ordem, buscar a taxa de câmbio na data do pagamento
        let totalBRL = totalsByCurrency['BRL'] || 0;

        // Converter USD para BRL usando a taxa de cada ordem
        for (const order of orders.data) {
            if (order.currency === 'USD' && order.effectivePaymentDate) {
                const usdRate = await this.getExchangeRate('USD-BRL', new Date(order.effectivePaymentDate));
                if (usdRate) {
                    const netAmount = order.invoiceAmount - order.taxAmount;
                    totalBRL += netAmount * usdRate.rate;
                }
            } else if (order.currency === 'EUR' && order.effectivePaymentDate) {
                const eurRate = await this.getExchangeRate('EUR-BRL', new Date(order.effectivePaymentDate));
                if (eurRate) {
                    const netAmount = order.invoiceAmount - order.taxAmount;
                    totalBRL += netAmount * eurRate.rate;
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
            ordersCount: orders.data.length
        };
    }

    private async getExchangeRate(currencyPair: string, date: Date) {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        const rates = await Repository.findAll(ExchangeRatesEntity, {
            where: {
                currencyPair,
                date: { $lte: date }
            },
            limit: 1,
            orderBy: { date: 'DESC' }
        });
        return rates.data.length > 0 ? rates.data[0] : null;
    }
}

