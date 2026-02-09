import { Module } from '@cmmv/core';
import { TaxRegimesController } from './tax-regimes.controller';

export const SasTaxRegimesModule = new Module('sas-tax-regimes', {
    providers: [],
    controllers: [TaxRegimesController]
});
