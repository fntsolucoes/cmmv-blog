import { Module } from '@cmmv/core';

import {
    DashboardService
} from "./dashboard.service";

import {
    DashboardController
} from "./dashboard.controller";

export const SasDashboardModule = new Module('sas-dashboard', {
    providers: [DashboardService],
    controllers: [DashboardController]
});

