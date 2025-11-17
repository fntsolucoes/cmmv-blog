import { Module } from '@cmmv/core';

import {
    PaymentOrdersService
} from "./payment-orders.service";

import {
    PaymentOrdersBusinessController
} from "./payment-orders.controller";

export const SasPaymentOrdersModule = new Module('sas-payment-orders', {
    providers: [PaymentOrdersService],
    controllers: [PaymentOrdersBusinessController]
});



