import { Module } from '@cmmv/core';

import {
    PaymentOrdersService
} from "./payment-orders.service";

import {
    PaymentOrdersBusinessController
} from "./payment-orders.controller";

import { SasTaxCalcModule } from '../tax-calc/tax-calc.module';

export const SasPaymentOrdersModule = new Module('sas-payment-orders', {
    providers: [PaymentOrdersService],
    controllers: [PaymentOrdersBusinessController],
    imports: [SasTaxCalcModule]
});



