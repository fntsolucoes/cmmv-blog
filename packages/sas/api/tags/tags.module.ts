import { Module } from '@cmmv/core';

import {
    SasTagsCustomService
} from "./tags.service";

import {
    SasTagsCustomController
} from "./tags.controller";

import {
    ScriptSettingsService
} from "../script-settings/script-settings.service";

export const SasTagsModule = new Module('sas-tags', {
    providers: [SasTagsCustomService, ScriptSettingsService],
    controllers: [SasTagsCustomController]
});

