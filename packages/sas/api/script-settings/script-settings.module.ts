import { Module } from '@cmmv/core';

import {
    ScriptSettingsService
} from "./script-settings.service";

import {
    ScriptSettingsController
} from "./script-settings.controller";

export const SasScriptSettingsModule = new Module('sas-script-settings', {
    providers: [ScriptSettingsService],
    controllers: [ScriptSettingsController]
});

