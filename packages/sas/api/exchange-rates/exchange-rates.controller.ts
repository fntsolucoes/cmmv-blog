import {
    Controller, Get, Query, Post
} from "@cmmv/http";

import {
    ExchangeRatesService
} from "./exchange-rates.service";

@Controller("sas/exchange-rates")
export class ExchangeRatesController {
    constructor(private readonly exchangeRatesService: ExchangeRatesService){}

    @Get("latest/:currencyPair")
    async getLatestRate(@Query("currencyPair") currencyPair: string) {
        return await this.exchangeRatesService.getLatestRate(currencyPair);
    }

    @Get("date/:currencyPair")
    async getRateByDate(
        @Query("currencyPair") currencyPair: string,
        @Query("date") date: string
    ) {
        return await this.exchangeRatesService.getRateForDate(currencyPair, new Date(date));
    }

    @Post("fetch-today")
    async fetchTodayRates() {
        return await this.exchangeRatesService.fetchTodayRates();
    }
}

