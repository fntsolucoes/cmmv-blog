import {
    Controller, Get, Param
} from "@cmmv/http";

import {
    PaymentOrdersService
} from "./payment-orders.service";

@Controller("sas/payment-orders")
export class PaymentOrdersController {
    constructor(private readonly paymentOrdersService: PaymentOrdersService){}

    @Get(":id/net-amount")
    async getNetAmount(@Param("id") id: string) {
        return await this.paymentOrdersService.calculateNetAmount(id);
    }
}

