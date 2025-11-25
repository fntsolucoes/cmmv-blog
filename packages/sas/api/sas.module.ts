import { Module } from '@cmmv/core';

import {
    SasCostCentersContract,
    SasCommercialPartnersContract,
    SasCampaignsContract,
    SasPaymentOrdersContract,
    SasShareholdersContract,
    SasExchangeRatesContract,
    SasPaymentChecklistContract,
    SasTicketsContract,
    SasTicketQueuesContract,
    SasTicketCommentsContract,
    SasTicketAttachmentsContract,
    SasTicketHistoryContract,
    SasTicketPartnersContract
} from '../contracts';

import { SasCostCentersModule } from './cost-centers/cost-centers.module';
import { SasCommercialPartnersModule } from './commercial-partners/commercial-partners.module';
import { SasCampaignsModule } from './campaigns/campaigns.module';
import { SasPaymentOrdersModule } from './payment-orders/payment-orders.module';
import { SasShareholdersModule } from './shareholders/shareholders.module';
import { SasExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { SasProfitSharingModule } from './profit-sharing/profit-sharing.module';
import { SasDashboardModule } from './dashboard/dashboard.module';
import { SasPaymentChecklistModule } from './payment-checklist/payment-checklist.module';
import { SasTicketsModule } from './tickets/tickets.module';
import { SasTicketCommentsModule } from './ticket-comments/ticket-comments.module';
import { SasTicketPartnersModule } from './ticket-partners/ticket-partners.module';
import { SasUsersModule } from './users/users.module';

export const SasModule = new Module('sas', {
    contracts: [
        SasCostCentersContract,
        SasCommercialPartnersContract,
        SasCampaignsContract,
        SasPaymentOrdersContract,
        SasShareholdersContract,
        SasExchangeRatesContract,
        SasPaymentChecklistContract,
        SasTicketsContract,
        SasTicketQueuesContract,
        SasTicketCommentsContract,
        SasTicketAttachmentsContract,
        SasTicketHistoryContract,
        SasTicketPartnersContract
    ],
    submodules: [
        SasCostCentersModule,
        SasCommercialPartnersModule,
        SasCampaignsModule,
        SasPaymentOrdersModule,
        SasShareholdersModule,
        SasExchangeRatesModule,
        SasProfitSharingModule,
        SasDashboardModule,
        SasPaymentChecklistModule,
        SasUsersModule,
        SasTicketsModule,
        SasTicketCommentsModule,
        SasTicketPartnersModule
    ]
});




