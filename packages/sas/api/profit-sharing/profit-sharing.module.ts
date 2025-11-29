import { Module } from '@cmmv/core';

import {
    ProfitSharingService
} from "./profit-sharing.service";

import {
    ProfitSharingController
} from "./profit-sharing.controller";

export const SasProfitSharingModule = new Module('sas-profit-sharing', {
    providers: [ProfitSharingService],
    controllers: [ProfitSharingController]
});














