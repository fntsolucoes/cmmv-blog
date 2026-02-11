import { Module } from '@cmmv/core';
import { CostCenterTaxRulesController } from './cost-center-tax-rules.controller';

export const SasCostCenterTaxRulesModule = new Module('sas-cost-center-tax-rules', {
    providers: [],
    controllers: [CostCenterTaxRulesController]
});
