import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import { parse } from 'csv-parse/sync';
import * as https from 'https';
import * as http from 'http';

@Service()
export class ExchangeRatesService {
    /**
     * Buscar taxa de câmbio para uma data específica
     */
    async getRateByDate(currencyPair: string, date: Date) {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        
        // Normalizar data para comparação
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        
        // Buscar todos os registros da moeda e filtrar por data
        const allRates = await Repository.findAll(ExchangeRatesEntity, {
            currencyPair
        }, [], {
            order: {
                date: 'DESC'
            }
        });
        
        if (!allRates?.data) {
            return null;
        }
        
        // Encontrar registro com a mesma data (comparando apenas dia/mês/ano)
        for (const rateItem of allRates.data) {
            const rateDate = new Date(rateItem.date);
            rateDate.setHours(0, 0, 0, 0);
            if (rateDate.getTime() === normalizedDate.getTime()) {
                return rateItem;
            }
        }
        
        return null;
    }

    /**
     * Criar ou atualizar taxa de câmbio
     */
    async upsertRate(currencyPair: string, date: Date, rate: number, source: string = 'csv-import') {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        
        // Validar inputs
        if (!currencyPair || (currencyPair !== 'EUR-BRL' && currencyPair !== 'USD-BRL')) {
            throw new Error(`Moeda inválida: ${currencyPair}. Apenas EUR-BRL e USD-BRL são suportadas.`);
        }
        
        if (!date || isNaN(date.getTime())) {
            throw new Error(`Data inválida: ${date}`);
        }
        
        if (isNaN(rate) || rate <= 0) {
            throw new Error(`Taxa inválida: ${rate}`);
        }
        
        // Normalizar data
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        
        // Verificar se já existe
        const existing = await this.getRateByDate(currencyPair, normalizedDate);
        
        if (existing) {
            // Atualizar registro existente
            await Repository.update(ExchangeRatesEntity, existing.id, {
                rate,
                source
            });
            return existing;
        }
        
        // Criar novo registro
        const result = await Repository.insert(ExchangeRatesEntity, {
            currencyPair,
            date: normalizedDate,
            rate,
            source
        });
        
        return result?.data || result;
    }

    /**
     * Parse date from format DD.MM.YYYY to Date object
     */
    private parseDate(dateStr: string): Date | null {
        try {
            // Formato: "06.11.2025" ou "06/11/2025"
            let parts: string[];
            if (dateStr.includes('.')) {
                parts = dateStr.split('.');
            } else if (dateStr.includes('/')) {
                parts = dateStr.split('/');
            } else {
                return null;
            }
            
            if (parts.length !== 3) {
                return null;
            }
            
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
            const year = parseInt(parts[2], 10);
            
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                return null;
            }
            
            const date = new Date(year, month, day);
            
            // Validar data
            if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
                return null;
            }
            
            return date;
        } catch {
            return null;
        }
    }

    /**
     * Parse decimal number from Brazilian format (comma as decimal separator)
     * Example: "6,1805" -> 6.1805
     */
    private parseDecimal(value: string): number | null {
        try {
            if (value === undefined || value === null) return null;
            let clean = String(value).trim();
            // Remove surrounding quotes
            if (clean.startsWith('"') && clean.endsWith('"')) {
                clean = clean.slice(1, -1).trim();
            }
            // Remove percent sign and whitespace
            clean = clean.replace(/%/g, '').replace(/\s+/g, '');
            // Remove thousand separators (.) and normalize decimal comma to dot
            // e.g., 10.123,45 -> 10123.45 ; 6,1805 -> 6.1805
            clean = clean.replace(/\./g, '').replace(/,/g, '.');
            
            const parsed = Number.parseFloat(clean);
            if (!Number.isFinite(parsed) || parsed <= 0) return null;
            return parsed;
        } catch {
            return null;
        }
    }

    /**
     * Detect currency from filename
     */
    private detectCurrencyFromFilename(filename: string): string | null {
        const upperFilename = filename.toUpperCase();
        
        if (upperFilename.includes('EUR') && upperFilename.includes('BRL')) {
            return 'EUR-BRL';
        }
        
        if (upperFilename.includes('USD') && upperFilename.includes('BRL')) {
            return 'USD-BRL';
        }
        
        return null;
    }

    /**
     * Buscar taxa mais recente disponível
     */
    async getLatestRate(currencyPair: string) {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        const rates = await Repository.findAll(ExchangeRatesEntity, {
            currencyPair,
            limit: 1
        }, [], {
            order: {
                date: 'DESC'
            }
        });
        
        if (!rates || !rates.data || rates.data.length === 0) {
            return { data: null };
        }
        
        return { data: rates.data[0] };
    }

    /**
     * Buscar taxa para uma data específica ou a mais próxima anterior
     */
    async getRateForDate(currencyPair: string, date: Date) {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        // Para comparações de data, precisamos usar operadores do TypeORM
        // Por enquanto, vamos buscar todas e filtrar manualmente
        const rates = await Repository.findAll(ExchangeRatesEntity, {
            currencyPair,
            limit: 1000
        }, [], {
            order: {
                date: 'DESC'
            }
        });
        
        if (!rates || !rates.data) {
            return { data: null };
        }
        
        // Filtrar por data <= date especificada
        const filtered = rates.data.filter((rate: any) => {
            const rateDate = new Date(rate.date);
            rateDate.setHours(0, 0, 0, 0);
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            return rateDate <= targetDate;
        });
        
        return { data: filtered.length > 0 ? filtered[0] : null };
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
     * Buscar últimos 30 dias de cotações do Investing.com
     */
    async fetchLast30Days() {
        const results = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Buscar para EUR-BRL e USD-BRL
        const pairs = ['EUR-BRL', 'USD-BRL'];
        
        for (const pair of pairs) {
            try {
                // Buscar taxa de hoje
                const rate = await this.fetchInvestingRate(pair, today);
                if (rate) {
                    results.push(rate);
                }
            } catch (error) {
                console.error(`Erro ao buscar ${pair}:`, error);
            }
        }

        return {
            success: true,
            count: results.length,
            results
        };
    }

    /**
     * Importar taxas de câmbio de um arquivo CSV
     * Formato esperado: "Data","Último","Abertura","Máxima","Mínima","Vol.","Var%"
     * Data no formato DD.MM.YYYY
     * Valores com vírgula como separador decimal
     */
    async importFromCSV(csvContent: string, currencyPair?: string, fileName?: string): Promise<{
        data: {
            imported: number;
            updated: number;
            errors: string[];
        }
    }> {
        const errors: string[] = [];
        let imported = 0;
        let updated = 0;

        try {
            // 1. Detectar moeda do nome do arquivo (prioridade) ou usar a selecionada
            let detectedPair = currencyPair;
            if (!detectedPair && fileName) {
                detectedPair = this.detectCurrencyFromFilename(fileName);
            }

            if (!detectedPair || (detectedPair !== 'EUR-BRL' && detectedPair !== 'USD-BRL')) {
                return {
                    imported: 0,
                    updated: 0,
                    errors: ['Par de moedas não identificado. Use EUR-BRL ou USD-BRL no nome do arquivo ou selecione manualmente.']
                };
            }

            // 2. Parse CSV usando csv-parse (mesma abordagem do 1001div)
            interface CSVRow {
                Data: string;
                Último: string;
                Abertura?: string;
                Máxima?: string;
                Mínima?: string;
                Vol?: string;
                'Var%'?: string;
            }

            const records: CSVRow[] = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true, // Handle BOM if present
            });

            if (records.length === 0) {
                return {
                    imported: 0,
                    updated: 0,
                    errors: ['O arquivo CSV está vazio ou não contém dados válidos.']
                };
            }

            // 3. Validar cabeçalho
            const firstRow = records[0];
            const requiredColumns = ['Data', 'Último'];
            const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

            if (missingColumns.length > 0) {
                return {
                    imported: 0,
                    updated: 0,
                    errors: [`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`]
                };
            }

            // 4. Processar cada linha
            for (let i = 0; i < records.length; i++) {
                const row = records[i];
                const rowNumber = i + 2; // +2 porque linha 1 é cabeçalho

                try {
                    // Parse date
                    const date = this.parseDate(row.Data);
                    if (!date) {
                        errors.push(`Linha ${rowNumber}: Data inválida: ${row.Data}`);
                        continue;
                    }

                    // Parse rate (Último - closing rate)
                    const rate = this.parseDecimal(row.Último);
                    if (!rate) {
                        errors.push(`Linha ${rowNumber}: Taxa inválida: ${row.Último}`);
                        continue;
                    }

                    // Verificar se já existe
                    const existingRate = await this.getRateByDate(detectedPair, date);

                    if (existingRate) {
                        // Atualizar registro existente
                        await this.upsertRate(detectedPair, date, rate, 'csv-import');
                        updated++;
                    } else {
                        // Criar novo registro
                        await this.upsertRate(detectedPair, date, rate, 'csv-import');
                        imported++;
                    }
                } catch (error) {
                    errors.push(`Linha ${rowNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                }
            }

            return { data: { imported, updated, errors: errors.slice(0, 10) } };
        } catch (error) {
            errors.push(`Erro ao processar arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return { data: { imported, updated, errors } };
        }
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
                            currencyPair,
                            date: date
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

