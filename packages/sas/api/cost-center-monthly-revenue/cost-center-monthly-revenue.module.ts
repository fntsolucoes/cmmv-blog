import { Module } from '@cmmv/core';
import { CostCenterMonthlyRevenueController } from './cost-center-monthly-revenue.controller';

export const SasCostCenterMonthlyRevenueModule = new Module('sas-cost-center-monthly-revenue', {
    providers: [],
    controllers: [CostCenterMonthlyRevenueController]
});
