import {
    Controller, Get, Query, Post, Body, Param
} from "@cmmv/http";

import {
    ExchangeRatesService
} from "./exchange-rates.service";

@Controller("sas/exchange-rates")
export class ExchangeRatesController {
    constructor(private readonly exchangeRatesService: ExchangeRatesService){}

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
}

