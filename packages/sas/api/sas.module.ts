import "reflect-metadata";
import { Module } from '@cmmv/core';

import {
    SasCostCentersContract,
    SasCommercialPartnersContract,
    SasCampaignsContract,
    SasPaymentOrdersContract,
    SasShareholdersContract,
    SasExchangeRatesContract,
    SasPaymentChecklistContract,
    SasTagsContract,
    SasScriptSettingsContract,
    SasTicketsContract,
    SasTicketQueuesContract,
    SasTicketCommentsContract,
    SasTicketAttachmentsContract,
    SasTicketHistoryContract,
    SasTicketPartnersContract,
    SasTaxRegimesContract,
    SasTaxRulesContract,
    SasTaxIssMunicipalityContract,
    SasCostCenterTaxRulesContract,
    SasCostCenterMonthlyRevenueContract,
    SasCostCenterMonthlyFatorRContract,
    SasSimplesNacionalAnnexBracketsContract,
    SasSimplesNacionalCnaeContract
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
import { SasTagsModule } from './tags/tags.module';
import { SasScriptSettingsModule } from './script-settings/script-settings.module';
import { SasTicketsModule } from './tickets/tickets.module';
import { SasTicketCommentsModule } from './ticket-comments/ticket-comments.module';
import { SasTicketPartnersModule } from './ticket-partners/ticket-partners.module';
import { SasUsersModule } from './users/users.module';
import { SasTaxRegimesModule } from './tax-regimes/tax-regimes.module';
import { SasTaxRulesModule } from './tax-rules/tax-rules.module';
import { SasTaxIssMunicipalityModule } from './tax-iss-municipality/tax-iss-municipality.module';
import { SasTaxCalcModule } from './tax-calc/tax-calc.module';
import { SasCostCenterTaxRulesModule } from './cost-center-tax-rules/cost-center-tax-rules.module';
import { SasCostCenterMonthlyRevenueModule } from './cost-center-monthly-revenue/cost-center-monthly-revenue.module';
import { SasCostCenterMonthlyFatorRModule } from './cost-center-monthly-fator-r/cost-center-monthly-fator-r.module';
import { SasSimplesNacionalCnaeModule } from './simples-nacional-cnae/simples-nacional-cnae.module';

export const SasModule = new Module('sas', {
    contracts: [
        SasCostCentersContract,
        SasCommercialPartnersContract,
        SasCampaignsContract,
        SasPaymentOrdersContract,
        SasShareholdersContract,
        SasExchangeRatesContract,
        SasPaymentChecklistContract,
        SasTagsContract,
        SasScriptSettingsContract,
        SasTicketsContract,
        SasTicketQueuesContract,
        SasTicketCommentsContract,
        SasTicketAttachmentsContract,
        SasTicketHistoryContract,
        SasTicketPartnersContract,
        SasTaxRegimesContract,
        SasTaxRulesContract,
        SasTaxIssMunicipalityContract,
        SasCostCenterTaxRulesContract,
        SasCostCenterMonthlyRevenueContract,
        SasCostCenterMonthlyFatorRContract,
        SasSimplesNacionalAnnexBracketsContract,
        SasSimplesNacionalCnaeContract
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
        SasTagsModule,
        SasScriptSettingsModule,
        SasUsersModule,
        SasTicketsModule,
        SasTicketCommentsModule,
        SasTicketPartnersModule,
        SasTaxRegimesModule,
        SasTaxRulesModule,
        SasTaxIssMunicipalityModule,
        SasTaxCalcModule,
        SasCostCenterTaxRulesModule,
        SasCostCenterMonthlyRevenueModule,
        SasCostCenterMonthlyFatorRModule,
        SasSimplesNacionalCnaeModule
    ]
});




