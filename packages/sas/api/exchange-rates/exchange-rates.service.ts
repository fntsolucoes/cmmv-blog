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
     * Compara apenas dia/mês/ano usando UTC (ignorando timezone local)
     */
    async getRateByDate(currencyPair: string, date: Date) {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        
        // Normalizar data para UTC - extrair apenas dia/mês/ano
        const targetYear = date.getUTCFullYear();
        const targetMonth = date.getUTCMonth(); // 0-11
        const targetDay = date.getUTCDate();
        
        // Formatar para log com zeros à esquerda (DD/MM/AAAA)
        const targetDayStr = String(targetDay).padStart(2, '0');
        const targetMonthStr = String(targetMonth + 1).padStart(2, '0');
        const targetDateStr = `${targetDayStr}/${targetMonthStr}/${targetYear}`;
        
        console.log(`[getRateByDate] Buscando taxa para ${currencyPair} na data ${targetDateStr} (DD/MM/AAAA UTC)`);
        
        // Buscar TODOS os registros da moeda
        // IMPORTANTE: Não passar 'limit' como filtro, apenas campos da entidade
        const allRates = await Repository.findAll(ExchangeRatesEntity, {
            currencyPair
        }, [], {
            order: {
                date: 'DESC'
            }
        });
        
        console.log(`[getRateByDate] Total de registros encontrados para ${currencyPair}: ${allRates?.data?.length || 0}`);
        
        if (!allRates?.data || allRates.data.length === 0) {
            console.log(`[getRateByDate] ❌ Nenhum registro encontrado para ${currencyPair}`);
            return null;
        }
        
        // Filtrar manualmente comparando apenas dia/mês/ano em UTC (ignorando hora)
        // IMPORTANTE: Comparar valores numéricos, não strings formatadas
        for (const rateItem of allRates.data) {
            // Normalizar data do banco - pode vir como string ISO (AAAA-MM-DD) ou Date object
            let rateDate: Date;
            if (typeof rateItem.date === 'string') {
                // Se for string ISO (AAAA-MM-DD), criar Date em UTC para evitar problemas de timezone
                const dateStr = rateItem.date;
                // Se for formato ISO sem hora (AAAA-MM-DD), adicionar hora 00:00:00 UTC
                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    rateDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
                } else {
                    // Se já tiver hora, usar diretamente
                    rateDate = new Date(dateStr);
                }
            } else {
                rateDate = new Date(rateItem.date);
            }
            
            const rateYear = rateDate.getUTCFullYear();
            const rateMonth = rateDate.getUTCMonth(); // 0-11
            const rateDay = rateDate.getUTCDate();
            const rateHour = rateDate.getUTCHours();
            
            // Formatar para log com zeros à esquerda (DD/MM/AAAA)
            const rateDayStr = String(rateDay).padStart(2, '0');
            const rateMonthStr = String(rateMonth + 1).padStart(2, '0');
            const rateDateStr = `${rateDayStr}/${rateMonthStr}/${rateYear}`;
            
            console.log(`[getRateByDate] Registro ID ${rateItem.id}: Data no banco=${rateItem.date}, UTC=${rateDateStr} às ${rateHour}h, Comparando com ${targetDateStr}`);
            
            // Comparar apenas dia/mês/ano usando UTC (ignorando hora/timezone)
            // IMPORTANTE: Comparar valores numéricos diretamente, não strings formatadas
            if (rateYear === targetYear &&
                rateMonth === targetMonth &&
                rateDay === targetDay) {
                console.log(`[getRateByDate] ✅ REGISTRO ENCONTRADO! ID: ${rateItem.id}, Data no banco: ${rateItem.date}, UTC: ${rateDateStr}, Taxa: ${rateItem.rate}`);
                return rateItem;
            }
        }
        
        console.log(`[getRateByDate] ❌ Nenhum registro encontrado para a data ${targetDateStr} (DD/MM/AAAA UTC)`);
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
        
        // Normalizar data para UTC com 12h (meio-dia) para evitar problemas de timezone
        // Usar meio-dia garante que mesmo convertendo para timezone local, o dia permanece o mesmo
        const normalizedDate = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            12, 0, 0, 0
        ));
        
        // Verificar se já existe
        const existing = await this.getRateByDate(currencyPair, normalizedDate);
        
        if (existing) {
            // Atualizar registro existente
            console.log(`[UPSERT] Atualizando registro existente ID ${existing.id} para ${normalizedDate.toLocaleDateString('pt-BR')} com taxa ${rate}`);
            try {
                const updateResult = await Repository.update(ExchangeRatesEntity, existing.id, {
                    rate,
                    source
                });
                console.log(`[UPSERT] Resultado da atualização:`, updateResult);
                return existing;
            } catch (error) {
                console.error(`[UPSERT] Erro ao atualizar:`, error);
                throw error;
            }
        }
        
        // Criar novo registro
        console.log(`[UPSERT] Criando novo registro para ${normalizedDate.toLocaleDateString('pt-BR')} com taxa ${rate}`);
        try {
            const result = await Repository.insert(ExchangeRatesEntity, {
                currencyPair,
                date: normalizedDate,
                rate,
                source
            });
            
            // Verificar se a inserção foi bem-sucedida
            if (result && (result.success === false || result.message)) {
                console.error(`[UPSERT] Erro na inserção:`, result);
                // Se for erro de constraint UNIQUE, tentar buscar e atualizar
                if (result.message && result.message.includes('UNIQUE constraint')) {
                    console.log(`[UPSERT] Tentando buscar registro existente após erro de constraint...`);
                    const existingAfterError = await this.getRateByDate(currencyPair, normalizedDate);
                    if (existingAfterError) {
                        console.log(`[UPSERT] Registro encontrado após erro, atualizando...`);
                        await Repository.update(ExchangeRatesEntity, existingAfterError.id, {
                            rate,
                            source
                        });
                        return existingAfterError;
                    }
                }
                throw new Error(result.message || 'Erro ao inserir registro');
            }
            
            console.log(`[UPSERT] Resultado da inserção:`, result);
            return result?.data || result;
        } catch (error: any) {
            console.error(`[UPSERT] Erro ao inserir:`, error);
            // Se for erro de constraint UNIQUE, tentar buscar e atualizar
            if (error.message && error.message.includes('UNIQUE constraint')) {
                console.log(`[UPSERT] Erro de constraint UNIQUE detectado, tentando buscar e atualizar...`);
                const existingAfterError = await this.getRateByDate(currencyPair, normalizedDate);
                if (existingAfterError) {
                    console.log(`[UPSERT] Registro encontrado após erro, atualizando...`);
                    await Repository.update(ExchangeRatesEntity, existingAfterError.id, {
                        rate,
                        source
                    });
                    return existingAfterError;
                }
            }
            throw error;
        }
    }

    /**
     * Parse date from CSV format DD.MM.AAAA
     * Cria data em UTC com hora 12h (meio-dia) para evitar problemas de timezone
     * IMPORTANTE: O CSV está no formato DD.MM.AAAA (dia.mês.ano) com ponto como separador
     */
    private parseDate(dateStr: string): Date | null {
        try {
            // Formato do CSV: "06.11.2025" (DD.MM.AAAA) - apenas ponto como separador
            if (!dateStr.includes('.')) {
                console.log(`[parseDate] Formato inválido: ${dateStr} (esperado DD.MM.AAAA com ponto como separador)`);
                return null;
            }
            
            const parts = dateStr.split('.');
            
            if (parts.length !== 3) {
                console.log(`[parseDate] Formato inválido: ${dateStr} (esperado 3 partes separadas por ponto: DD.MM.AAAA)`);
                return null;
            }
            
            // CSV está em formato DD.MM.AAAA
            // parts[0] = dia (DD)
            // parts[1] = mês (MM)
            // parts[2] = ano (AAAA)
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed no JavaScript
            const year = parseInt(parts[2], 10);
            
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                console.log(`[parseDate] Valores inválidos: dia=${parts[0]}, mês=${parts[1]}, ano=${parts[2]}`);
                return null;
            }
            
            // Criar data em UTC com 12h (meio-dia) para evitar problemas de timezone
            // Usar meio-dia garante que mesmo convertendo para timezone local, o dia permanece o mesmo
            const date = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
            
            // Validar data usando UTC
            if (date.getUTCDate() !== day || date.getUTCMonth() !== month || date.getUTCFullYear() !== year) {
                console.log(`[parseDate] Data inválida após criação: entrada=${dateStr}, dia=${day}, mês=${month + 1}, ano=${year}, resultado=${date.toISOString()}`);
                return null;
            }
            
            console.log(`[parseDate] ✅ Parse bem-sucedido: ${dateStr} (DD.MM.AAAA) -> ${day}/${month + 1}/${year} às 12h UTC -> ${date.toISOString()}`);
            return date;
        } catch (error) {
            console.log(`[parseDate] Erro ao fazer parse de ${dateStr}:`, error);
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
     * Buscar todas as taxas de câmbio (opcionalmente filtradas por moeda, data e com paginação)
     */
    async getAllRates(
        currencyPair?: string, 
        limit?: number,
        page?: number,
        startDate?: string,
        endDate?: string,
        orderBy: 'ASC' | 'DESC' = 'DESC'
    ) {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        
        const filters: any = {};
        if (currencyPair) {
            filters.currencyPair = currencyPair;
        }
        
        // Buscar todos os registros primeiro para filtrar por data (se necessário)
        // Depois aplicamos paginação
        // IMPORTANTE: Não passar 'limit', 'page' ou outros parâmetros de paginação como filtros
        // Apenas campos da entidade devem ser passados como filtros
        const queryFilters: any = {};
        
        if (currencyPair) {
            queryFilters.currencyPair = currencyPair;
        }
        
        // Buscar TODOS os registros usando limit alto
        // Ordenar por data decrescente
        const allRates = await Repository.findAll(ExchangeRatesEntity, {
            ...queryFilters,
            limit: 10000  // Limite alto para pegar todos os registros
        }, [], {
            order: {
                date: orderBy  // 'DESC' por padrão
            }
        });
        
        let filteredData = allRates?.data || [];
        
        // Filtrar por data se fornecido (usando UTC para comparação)
        if (startDate || endDate) {
            filteredData = filteredData.filter((rate: any) => {
                const rateDate = new Date(rate.date);
                const rateYear = rateDate.getUTCFullYear();
                const rateMonth = rateDate.getUTCMonth();
                const rateDay = rateDate.getUTCDate();
                
                if (startDate) {
                    // startDate vem no formato "YYYY-MM-DD"
                    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
                    const startDateUTC = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
                    
                    const startYearUTC = startDateUTC.getUTCFullYear();
                    const startMonthUTC = startDateUTC.getUTCMonth();
                    const startDayUTC = startDateUTC.getUTCDate();
                    
                    // Comparar apenas dia/mês/ano em UTC
                    if (rateYear < startYearUTC) return false;
                    if (rateYear === startYearUTC && rateMonth < startMonthUTC) return false;
                    if (rateYear === startYearUTC && rateMonth === startMonthUTC && rateDay < startDayUTC) return false;
                }
                
                if (endDate) {
                    // endDate vem no formato "YYYY-MM-DD"
                    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
                    const endDateUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));
                    
                    const endYearUTC = endDateUTC.getUTCFullYear();
                    const endMonthUTC = endDateUTC.getUTCMonth();
                    const endDayUTC = endDateUTC.getUTCDate();
                    
                    // Comparar apenas dia/mês/ano em UTC
                    if (rateYear > endYearUTC) return false;
                    if (rateYear === endYearUTC && rateMonth > endMonthUTC) return false;
                    if (rateYear === endYearUTC && rateMonth === endMonthUTC && rateDay > endDayUTC) return false;
                }
                
                return true;
            });
        }
        
        // Aplicar paginação
        const totalRecords = filteredData.length;
        const itemsPerPage = limit || 30;
        const currentPage = page || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / itemsPerPage) : 0;
        
        console.log(`[getAllRates] Retornando: ${paginatedData.length} registros de ${totalRecords} total, página ${currentPage}/${totalPages}`);
        
        return {
            data: paginatedData || [],
            total: totalRecords || 0,
            page: currentPage,
            limit: itemsPerPage,
            totalPages: totalPages
        };
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
        // Normalizar para UTC com 12h (meio-dia) para evitar problemas de timezone
        const normalizedToday = new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
            12, 0, 0, 0
        ));

        const results = [];

        // Buscar EUR-BRL
        try {
            const eurRate = await this.fetchInvestingRate('EUR-BRL', normalizedToday);
            if (eurRate) {
                results.push(eurRate);
            }
        } catch (error) {
            console.error('Erro ao buscar EUR-BRL:', error);
        }

        // Buscar USD-BRL
        try {
            const usdRate = await this.fetchInvestingRate('USD-BRL', normalizedToday);
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
        // Normalizar para UTC com 12h (meio-dia) para evitar problemas de timezone
        const normalizedToday = new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
            12, 0, 0, 0
        ));

        // Buscar para EUR-BRL e USD-BRL
        const pairs = ['EUR-BRL', 'USD-BRL'];
        
        for (const pair of pairs) {
            try {
                // Buscar taxa de hoje
                const rate = await this.fetchInvestingRate(pair, normalizedToday);
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
     * Formato esperado (padrão B3 / Investing exportado para PT-BR):
     * Cabeçalho: Data;Último;Abertura;Máxima;Mínima;Vol.;Var%
     * Delimitador: ';'
     * Data no formato DD.MM.AAAA (com ponto como separador)
     * Valores com vírgula como separador decimal (ex: 6,157)
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
                    data: {
                        imported: 0,
                        updated: 0,
                        errors: ['Par de moedas não identificado. Use EUR-BRL ou USD-BRL no nome do arquivo ou selecione manualmente.']
                    }
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
                delimiter: ';', // Arquivo de histórico usa ';' como separador
            });

            if (records.length === 0) {
                return {
                    data: {
                        imported: 0,
                        updated: 0,
                        errors: ['O arquivo CSV está vazio ou não contém dados válidos.']
                    }
                };
            }

            // 3. Validar cabeçalho
            const firstRow = records[0];
            const requiredColumns = ['Data', 'Último'];
            const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

            if (missingColumns.length > 0) {
                return {
                    data: {
                        imported: 0,
                        updated: 0,
                        errors: [`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`]
                    }
                };
            }

            // 4. Processar cada linha
            console.log(`[IMPORT] Processando ${records.length} registros do CSV...`);
            for (let i = 0; i < records.length; i++) {
                const row = records[i];
                const rowNumber = i + 2; // +2 porque linha 1 é cabeçalho

                try {
                    // Parse date
                    const date = this.parseDate(row.Data);
                    if (!date) {
                        console.log(`[IMPORT] Linha ${rowNumber}: Data inválida: ${row.Data}`);
                        errors.push(`Linha ${rowNumber}: Data inválida: ${row.Data}`);
                        continue;
                    }

                    // Parse rate (Último - closing rate)
                    const rate = this.parseDecimal(row.Último);
                    if (!rate) {
                        console.log(`[IMPORT] Linha ${rowNumber}: Taxa inválida: ${row.Último}`);
                        errors.push(`Linha ${rowNumber}: Taxa inválida: ${row.Último}`);
                        continue;
                    }

                    // Verificar se já existe
                    const existingRate = await this.getRateByDate(detectedPair, date);

                    if (existingRate) {
                        // Atualizar registro existente
                        console.log(`[IMPORT] Linha ${rowNumber}: Atualizando registro existente para ${date.toLocaleDateString('pt-BR')} (ID: ${existingRate.id})`);
                        try {
                            await this.upsertRate(detectedPair, date, rate, 'csv-import');
                            updated++;
                        } catch (error: any) {
                            console.error(`[IMPORT] Linha ${rowNumber}: Erro ao atualizar:`, error);
                            // Se o erro já foi tratado no upsertRate, não adicionar aos erros
                            if (!error.message || !error.message.includes('UNIQUE constraint')) {
                                errors.push(`Linha ${rowNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                            } else {
                                // Se foi tratado, considerar como atualizado
                                updated++;
                            }
                        }
                    } else {
                        // Criar novo registro
                        console.log(`[IMPORT] Linha ${rowNumber}: Criando novo registro para ${date.toLocaleDateString('pt-BR')} com taxa ${rate}`);
                        try {
                            await this.upsertRate(detectedPair, date, rate, 'csv-import');
                            imported++;
                        } catch (error: any) {
                            console.error(`[IMPORT] Linha ${rowNumber}: Erro ao inserir:`, error);
                            // Se o erro foi tratado no upsertRate (constraint UNIQUE), considerar como atualizado
                            if (error.message && error.message.includes('UNIQUE constraint')) {
                                console.log(`[IMPORT] Linha ${rowNumber}: Erro de constraint tratado, considerando como atualizado`);
                                updated++;
                            } else {
                                errors.push(`Linha ${rowNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`[IMPORT] Linha ${rowNumber}: Erro ao processar:`, error);
                    errors.push(`Linha ${rowNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                }
            }
            
            console.log(`[IMPORT] Processamento concluído: ${imported} importados, ${updated} atualizados, ${errors.length} erros`);

            return { data: { imported, updated, errors: errors.slice(0, 10) } };
        } catch (error) {
            errors.push(`Erro ao processar arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return { data: { imported, updated, errors } };
        }
    }

    /**
     * Validar importação CSV comparando com dados no banco
     * Retorna estatísticas de validação
     */
    async validateCSVImport(csvContent: string, currencyPair: string): Promise<{
        data: {
            csvRecords: number;
            dbRecords: number;
            matches: number;
            missing: Array<{ date: string; rate: number }>;
            extra: Array<{ date: string; rate: number }>;
            errors: string[];
        }
    }> {
        const errors: string[] = [];
        const missing: Array<{ date: string; rate: number }> = [];
        const extra: Array<{ date: string; rate: number }> = [];
        let matches = 0;

        try {
            // Parse CSV
            interface CSVRow {
                Data: string;
                Último: string;
            }

            const records: CSVRow[] = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true,
                delimiter: ';',
            });

            // Processar registros do CSV
            const csvData = new Map<string, number>(); // date -> rate
            for (const row of records) {
                const date = this.parseDate(row.Data);
                if (!date) {
                    errors.push(`Data inválida no CSV: ${row.Data}`);
                    continue;
                }

                const rate = this.parseDecimal(row.Último);
                if (!rate) {
                    errors.push(`Taxa inválida no CSV: ${row.Último}`);
                    continue;
                }

                // Usar UTC para criar a chave de data
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD em UTC
                csvData.set(dateKey, rate);
            }

            // Buscar registros do banco
            const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
            const dbRates = await Repository.findAll(ExchangeRatesEntity, {
                currencyPair
            });

            const dbData = new Map<string, number>(); // date -> rate
            if (dbRates?.data) {
                for (const rate of dbRates.data) {
                    const date = new Date(rate.date);
                    // Usar UTC para criar a chave de data
                    const year = date.getUTCFullYear();
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD em UTC
                    dbData.set(dateKey, rate.rate);
                }
            }

            // Comparar
            for (const [dateKey, csvRate] of csvData.entries()) {
                const dbRate = dbData.get(dateKey);
                if (dbRate === undefined) {
                    // Registro no CSV mas não no banco
                    const date = new Date(dateKey + 'T00:00:00.000Z'); // Usar UTC
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const year = date.getUTCFullYear();
                    missing.push({ date: `${day}/${month}/${year}`, rate: csvRate });
                } else if (Math.abs(dbRate - csvRate) < 0.0001) {
                    // Match exato (tolerância para ponto flutuante)
                    matches++;
                } else {
                    // Taxa diferente
                    const date = new Date(dateKey + 'T00:00:00.000Z'); // Usar UTC
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const year = date.getUTCFullYear();
                    errors.push(`Taxa diferente para ${day}/${month}/${year}: CSV=${csvRate}, DB=${dbRate}`);
                }
            }

            // Verificar registros extras no banco (não no CSV)
            for (const [dateKey, dbRate] of dbData.entries()) {
                if (!csvData.has(dateKey)) {
                    const date = new Date(dateKey + 'T00:00:00.000Z'); // Usar UTC
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const year = date.getUTCFullYear();
                    extra.push({ date: `${day}/${month}/${year}`, rate: dbRate });
                }
            }

            return {
                data: {
                    csvRecords: csvData.size,
                    dbRecords: dbData.size,
                    matches,
                    missing,
                    extra,
                    errors: errors.slice(0, 20) // Limitar a 20 erros
                }
            };
        } catch (error) {
            errors.push(`Erro ao validar importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return {
                data: {
                    csvRecords: 0,
                    dbRecords: 0,
                    matches: 0,
                    missing: [],
                    extra: [],
                    errors
                }
            };
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

                        // Normalizar data para UTC com 12h (meio-dia) para evitar problemas de timezone
                        const normalizedDate = new Date(Date.UTC(
                            date.getUTCFullYear(),
                            date.getUTCMonth(),
                            date.getUTCDate(),
                            12, 0, 0, 0
                        ));

                        // Verificar se já existe taxa para esta data
                        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
                        const existing = await this.getRateByDate(currencyPair, normalizedDate);

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
                                date: normalizedDate,
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

    /**
     * Limpar todas as taxas de câmbio da tabela
     * ATENÇÃO: Esta operação é irreversível!
     * Deleta TODOS os registros sem limite
     */
    async clearAllRates() {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        
        try {
            console.log('[clearAllRates] Iniciando limpeza completa da tabela de moedas...');
            
            // Buscar TODOS os registros com limite muito alto
            // Usar 100000 para garantir que pegamos todos
            const allRates = await Repository.findAll(ExchangeRatesEntity, {
                limit: 100000  // Limite muito alto para pegar todos
            }, [], {
                select: ['id'], // Apenas IDs para economizar memória
                order: {
                    date: 'DESC'
                }
            });
            
            const totalRecords = allRates?.data?.length || 0;
            
            console.log(`[clearAllRates] Total de registros encontrados: ${totalRecords}`);
            
            if (totalRecords === 0) {
                return {
                    success: true,
                    message: 'A tabela já está vazia.',
                    deleted: 0,
                    totalBefore: 0
                };
            }
            
            // Deletar em loop até não encontrar mais registros
            // Isso garante que deletamos TODOS, mesmo que haja mais de 100000
            let totalDeleted = 0;
            let iterations = 0;
            const maxIterations = 1000; // Proteção contra loop infinito
            
            while (iterations < maxIterations) {
                iterations++;
                
                // Buscar todos os registros disponíveis
                const currentBatch = await Repository.findAll(ExchangeRatesEntity, {
                    limit: 10000  // Buscar 10000 por vez
                }, [], {
                    select: ['id'],
                    order: {
                        date: 'DESC'
                    }
                });
                
                const currentIds = currentBatch?.data?.map((item: any) => item.id) || [];
                const currentCount = currentIds.length;
                
                if (currentCount === 0) {
                    // Não há mais registros
                    break;
                }
                
                console.log(`[clearAllRates] Iteração ${iterations}: Encontrados ${currentCount} registros para deletar...`);
                
                // Deletar todos os IDs encontrados
                let batchDeleted = 0;
                for (const id of currentIds) {
                    try {
                        await Repository.delete(ExchangeRatesEntity, id);
                        batchDeleted++;
                        totalDeleted++;
                    } catch (error) {
                        console.error(`[clearAllRates] Erro ao deletar registro ${id}:`, error);
                    }
                }
                
                console.log(`[clearAllRates] Iteração ${iterations}: ${batchDeleted} registros deletados (total: ${totalDeleted})`);
                
                // Se deletou menos que encontrou, pode haver problema
                if (batchDeleted < currentCount) {
                    console.warn(`[clearAllRates] Aviso: Deletados ${batchDeleted} de ${currentCount} registros encontrados`);
                }
                
                // Se encontrou menos que o limite, provavelmente chegamos ao fim
                if (currentCount < 10000) {
                    // Verificar uma última vez se há mais registros
                    const finalCheck = await Repository.findAll(ExchangeRatesEntity, {
                        limit: 1
                    }, [], {
                        select: ['id']
                    });
                    
                    if (!finalCheck?.data || finalCheck.data.length === 0) {
                        break;
                    }
                }
            }
            
            if (iterations >= maxIterations) {
                console.warn(`[clearAllRates] Aviso: Atingido limite de ${maxIterations} iterações`);
            }
            
            // Verificação final: tentar deletar qualquer registro restante com delete({})
            const finalCheck = await Repository.findAll(ExchangeRatesEntity, {
                limit: 1
            }, [], {
                select: ['id']
            });
            
            if (finalCheck?.data && finalCheck.data.length > 0) {
                console.log('[clearAllRates] Ainda há registros restantes, tentando limpeza final com delete({})...');
                try {
                    await Repository.delete(ExchangeRatesEntity, {});
                } catch (finalError) {
                    console.error('[clearAllRates] Erro na limpeza final:', finalError);
                }
            }
            
            console.log(`[clearAllRates] ✅ Tabela de moedas limpa. ${totalDeleted} registro(s) deletado(s) em ${iterations} iteração(ões).`);
            
            return {
                success: true,
                message: `Tabela de moedas limpa com sucesso. ${totalDeleted} registro(s) deletado(s).`,
                deleted: totalDeleted,
                totalBefore: totalRecords,
                iterations
            };
        } catch (error) {
            console.error('[clearAllRates] Erro ao limpar tabela:', error);
            return {
                success: false,
                message: `Erro ao limpar tabela: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                deleted: 0,
                totalBefore: 0
            };
        }
    }
}

