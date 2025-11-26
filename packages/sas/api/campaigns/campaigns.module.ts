import { Module } from '@cmmv/core';

import {
    CampaignsService
} from "./campaigns.service";

import {
    CampaignsController
} from "./campaigns.controller";

import {
    LinkValidatorService
} from "./link-validator.service";

export const SasCampaignsModule = new Module('sas-campaigns', {
    providers: [CampaignsService, LinkValidatorService],
    controllers: [CampaignsController]
});










