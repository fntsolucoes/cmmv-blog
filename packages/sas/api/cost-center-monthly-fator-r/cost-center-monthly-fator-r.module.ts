import { Module } from '@cmmv/core';
import { CostCenterMonthlyFatorRController } from './cost-center-monthly-fator-r.controller';

export const SasCostCenterMonthlyFatorRModule = new Module('sas-cost-center-monthly-fator-r', {
    providers: [],
    controllers: [CostCenterMonthlyFatorRController]
});
