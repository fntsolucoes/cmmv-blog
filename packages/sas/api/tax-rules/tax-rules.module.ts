import { Module } from '@cmmv/core';
import { TaxRulesController } from './tax-rules.controller';

export const SasTaxRulesModule = new Module('sas-tax-rules', {
    providers: [],
    controllers: [TaxRulesController]
});
