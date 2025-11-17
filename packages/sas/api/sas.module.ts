import { Module } from '@cmmv/core';

import {
    SasCostCentersContract,
    SasCommercialPartnersContract,
    SasCampaignsContract,
    SasPaymentOrdersContract,
    SasShareholdersContract,
    SasExchangeRatesContract
} from '../contracts';

import { SasCostCentersModule } from './cost-centers/cost-centers.module';
import { SasCommercialPartnersModule } from './commercial-partners/commercial-partners.module';
import { SasCampaignsModule } from './campaigns/campaigns.module';
import { SasPaymentOrdersModule } from './payment-orders/payment-orders.module';
import { SasShareholdersModule } from './shareholders/shareholders.module';
import { SasExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { SasProfitSharingModule } from './profit-sharing/profit-sharing.module';

export const SasModule = new Module('sas', {
    contracts: [
        SasCostCentersContract,
        SasCommercialPartnersContract,
        SasCampaignsContract,
        SasPaymentOrdersContract,
        SasShareholdersContract,
        SasExchangeRatesContract
    ],
    submodules: [
        SasCostCentersModule,
        SasCommercialPartnersModule,
        SasCampaignsModule,
        SasPaymentOrdersModule,
        SasShareholdersModule,
        SasExchangeRatesModule,
        SasProfitSharingModule
    ]
});



