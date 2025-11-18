import { Module } from '@cmmv/core';

import {
    PaymentChecklistService
} from "./payment-checklist.service";

import {
    PaymentChecklistController
} from "./payment-checklist.controller";

export const SasPaymentChecklistModule = new Module('sas-payment-checklist', {
    providers: [PaymentChecklistService],
    controllers: [PaymentChecklistController]
});

