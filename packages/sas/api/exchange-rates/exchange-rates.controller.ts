import {
    Controller, Get, Query, Post, Body, Param
} from "@cmmv/http";

import {
    ExchangeRatesService
} from "./exchange-rates.service";

@Controller("affiliation-manager/exchange-rates")
export class ExchangeRatesController {
    constructor(private readonly exchangeRatesService: ExchangeRatesService){}

    @Get()
    async getAllRates(
        @Query("currencyPair") currencyPair?: string,
        @Query("limit") limit?: string,
        @Query("page") page?: string,
        @Query("startDate") startDate?: string,
        @Query("endDate") endDate?: string,
        @Query("orderBy") orderBy?: string
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 30;
        const pageNum = page ? parseInt(page, 10) : 1;
        const order = (orderBy === 'ASC' || orderBy === 'DESC') ? orderBy : 'DESC';
        
        return await this.exchangeRatesService.getAllRates(
            currencyPair, 
            limitNum, 
            pageNum, 
            startDate, 
            endDate, 
            order
        );
    }

    @Get("last-10")
    async getLast10Rates(@Query("currencyPair") currencyPair?: string) {
        const result = await this.exchangeRatesService.getAllRates(currencyPair, 10);
        
        // Formatar para exibição
        const formatted = result.data.map((rate: any) => {
            const date = new Date(rate.date);
            return {
                id: rate.id,
                currencyPair: rate.currencyPair,
                date: date.toISOString().split('T')[0], // AAAA-MM-DD
                dateFormatted: date.toLocaleDateString('pt-BR'), // DD/MM/AAAA
                dateUTC: `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCFullYear()}`,
                rate: rate.rate,
                source: rate.source || 'N/A'
            };
        });
        
        return {
            data: formatted,
            total: result.data.length,
            message: `Últimas ${result.data.length} linhas da tabela de moedas${currencyPair ? ` (${currencyPair})` : ''}`
        };
    }

    @Get("latest/:currencyPair")
    async getLatestRate(@Param("currencyPair") currencyPair: string) {
        return await this.exchangeRatesService.getLatestRate(currencyPair);
    }

    @Get("date/:currencyPair")
    async getRateByDate(
        @Param("currencyPair") currencyPair: string,
        @Query("date") date: string
    ) {
        return await this.exchangeRatesService.getRateForDate(currencyPair, new Date(date));
    }

    @Post("fetch-today")
    async fetchTodayRates() {
        return await this.exchangeRatesService.fetchTodayRates();
    }

    @Post("fetch-last-30-days")
    async fetchLast30Days() {
        return await this.exchangeRatesService.fetchLast30Days();
    }

    @Post("import-csv")
    async importCSV(@Body() body: { csvContent: string; currencyPair?: string; fileName?: string }) {
        return await this.exchangeRatesService.importFromCSV(body.csvContent, body.currencyPair, body.fileName);
    }

    @Post("validate-import")
    async validateImport(@Body() body: { csvContent: string; currencyPair: string }) {
        return await this.exchangeRatesService.validateCSVImport(body.csvContent, body.currencyPair);
    }

    @Post("clear-all")
    async clearAllRates() {
        return await this.exchangeRatesService.clearAllRates();
    }

    @Get("clear-all")
    async clearAllRatesGet() {
        const result = await this.exchangeRatesService.clearAllRates();
        
        // Retornar HTML amigável para visualização no navegador
        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Limpeza de Tabela de Moedas</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-top: 0;
        }
        .success {
            color: #28a745;
            font-weight: bold;
            font-size: 18px;
            margin: 20px 0;
        }
        .error {
            color: #dc3545;
            font-weight: bold;
            font-size: 18px;
            margin: 20px 0;
        }
        .info {
            background: #e9ecef;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .info strong {
            color: #495057;
        }
        a {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }
        a:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗑️ Limpeza de Tabela de Moedas</h1>
        ${result.success 
            ? `<div class="success">✅ ${result.message}</div>
               <div class="info">
                   <strong>Registros deletados:</strong> ${result.deleted}<br>
                   <strong>Total antes da limpeza:</strong> ${result.totalBefore}
               </div>`
            : `<div class="error">❌ ${result.message}</div>`
        }
        <a href="/sas/exchange-rates/last-10">Ver últimas 10 linhas</a>
        <a href="/sas/exchange-rates" style="margin-left: 10px;">Ver todas as moedas</a>
    </div>
</body>
</html>
        `;
        
        return html;
    }
}

