import { Module } from '@cmmv/core';

import {
    ExchangeRatesService
} from "./exchange-rates.service";

import {
    ExchangeRatesController
} from "./exchange-rates.controller";

export const SasExchangeRatesModule = new Module('sas-exchange-rates', {
    providers: [ExchangeRatesService],
    controllers: [ExchangeRatesController]
});












