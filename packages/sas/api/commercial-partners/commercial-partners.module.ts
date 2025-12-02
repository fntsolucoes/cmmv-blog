import { Module } from '@cmmv/core';

import {
    CommercialPartnersService
} from "./commercial-partners.service";

import {
    CommercialPartnersController
} from "./commercial-partners.controller";

export const SasCommercialPartnersModule = new Module('sas-commercial-partners', {
    providers: [CommercialPartnersService],
    controllers: [CommercialPartnersController]
});















