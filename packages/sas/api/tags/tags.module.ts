import { Module } from '@cmmv/core';

import {
    TagsService
} from "./tags.service";

import {
    TagsController
} from "./tags.controller";

export const SasTagsModule = new Module('sas-tags', {
    providers: [TagsService],
    controllers: [TagsController]
});

