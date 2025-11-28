import { Module } from '@cmmv/core';

import {
    ShareholdersService
} from "./shareholders.service";

import {
    ShareholdersController
} from "./shareholders.controller";

export const SasShareholdersModule = new Module('sas-shareholders', {
    providers: [ShareholdersService],
    controllers: [ShareholdersController]
});













