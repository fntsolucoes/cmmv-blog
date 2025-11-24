import { Module } from '@cmmv/core';

import {
    CampaignsService
} from "./campaigns.service";

import {
    CampaignsController
} from "./campaigns.controller";

export const SasCampaignsModule = new Module('sas-campaigns', {
    providers: [CampaignsService],
    controllers: [CampaignsController]
});








