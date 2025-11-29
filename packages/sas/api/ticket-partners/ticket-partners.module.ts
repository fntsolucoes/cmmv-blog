import { Module } from '@cmmv/core';

import {
    TicketPartnersService
} from "./ticket-partners.service";

import {
    TicketPartnersController
} from "./ticket-partners.controller";

export const SasTicketPartnersModule = new Module('sas-ticket-partners', {
    providers: [TicketPartnersService],
    controllers: [TicketPartnersController]
});






