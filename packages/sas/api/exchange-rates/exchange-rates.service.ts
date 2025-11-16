import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import * as https from 'https';
import * as http from 'http';

@Service()
export class ExchangeRatesService {
    /**
     * Buscar taxa de câmbio para uma data específica
     */
    async getRateByDate(currencyPair: string, date: Date) {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        const rate = await Repository.findOne(ExchangeRatesEntity, {
            where: {
                currencyPair,
                date
            }
        });
        return rate;
    }

    /**
     * Buscar taxa mais recente disponível
     */
    async getLatestRate(currencyPair: string) {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        const rates = await Repository.findAll(ExchangeRatesEntity, {
            where: { currencyPair },
            limit: 1,
            orderBy: { date: 'DESC' }
        });
        return rates.data.length > 0 ? rates.data[0] : null;
    }

    /**
     * Buscar taxa para uma data específica ou a mais próxima anterior
     */
    async getRateForDate(currencyPair: string, date: Date) {
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

    /**
     * Buscar taxas de câmbio do Investing.com para hoje
     */
    async fetchTodayRates() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results = [];

        // Buscar EUR-BRL
        try {
            const eurRate = await this.fetchInvestingRate('EUR-BRL', today);
            if (eurRate) {
                results.push(eurRate);
            }
        } catch (error) {
            console.error('Erro ao buscar EUR-BRL:', error);
        }

        // Buscar USD-BRL
        try {
            const usdRate = await this.fetchInvestingRate('USD-BRL', today);
            if (usdRate) {
                results.push(usdRate);
            }
        } catch (error) {
            console.error('Erro ao buscar USD-BRL:', error);
        }

        return results;
    }

    /**
     * Buscar taxa do Investing.com usando web scraping
     * Nota: Esta é uma implementação básica. Em produção, considere usar uma API oficial ou biblioteca de scraping mais robusta
     */
    private async fetchInvestingRate(currencyPair: string, date: Date): Promise<any> {
        return new Promise((resolve, reject) => {
            const pairMap: Record<string, string> = {
                'EUR-BRL': 'eur-brl',
                'USD-BRL': 'usd-brl'
            };

            const pairSlug = pairMap[currencyPair];
            if (!pairSlug) {
                reject(new Error(`Par de moedas não suportado: ${currencyPair}`));
                return;
            }

            const url = `https://br.investing.com/currencies/${pairSlug}-historical-data`;
            
            const options = {
                hostname: 'br.investing.com',
                path: `/currencies/${pairSlug}-historical-data`,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
                }
            };

            https.get(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', async () => {
                    try {
                        // Extrair taxa da página HTML
                        // Nota: Esta é uma implementação simplificada
                        // Em produção, use uma biblioteca de scraping como cheerio ou puppeteer
                        const rateMatch = data.match(/data-test="last-price"[^>]*>([\d,\.]+)/);
                        
                        if (!rateMatch) {
                            // Tentar outro padrão
                            const altMatch = data.match(/"last-price"[^>]*>([\d,\.]+)/);
                            if (!altMatch) {
                                reject(new Error(`Não foi possível encontrar a taxa para ${currencyPair}`));
                                return;
                            }
                        }

                        const rateStr = (rateMatch?.[1] || '').replace(',', '.');
                        const rate = parseFloat(rateStr);

                        if (isNaN(rate)) {
                            reject(new Error(`Taxa inválida para ${currencyPair}: ${rateStr}`));
                            return;
                        }

                        // Verificar se já existe taxa para esta data
                        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
                        const existing = await Repository.findOne(ExchangeRatesEntity, {
                            where: {
                                currencyPair,
                                date: date
                            }
                        });

                        if (existing) {
                            // Atualizar taxa existente
                            await Repository.update(ExchangeRatesEntity, existing.id, {
                                rate,
                                source: 'investing.com'
                            });
                            resolve({ ...existing, rate, source: 'investing.com' });
                        } else {
                            // Criar nova taxa
                            const newRate = await Repository.insert(ExchangeRatesEntity, {
                                currencyPair,
                                date: date,
                                rate,
                                source: 'investing.com'
                            });
                            resolve(newRate);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }
}

