import { Module } from '@cmmv/core';

import {
    CostCentersService
} from "./cost-centers.service";

import {
    CostCentersController
} from "./cost-centers.controller";

export const SasCostCentersModule = new Module('sas-cost-centers', {
    providers: [CostCentersService],
    controllers: [CostCentersController]
});

