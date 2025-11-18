import {
    Controller, Get, Param
} from "@cmmv/http";

import {
    CommercialPartnersService
} from "./commercial-partners.service";

@Controller("sas/commercial-partners")
export class CommercialPartnersController {
    constructor(private readonly commercialPartnersService: CommercialPartnersService){}

    @Get(":id/payment-orders")
    async getPaymentOrdersHistory(@Param("id") id: string) {
        return await this.commercialPartnersService.getPaymentOrdersHistory(id);
    }

    @Get("all")
    async getAllPartners() {
        return await this.commercialPartnersService.getAllPartners();
    }
}




