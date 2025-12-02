import {
    Controller, Get, Param, Post
} from "@cmmv/http";

import {
    CommercialPartnersService
} from "./commercial-partners.service";

@Controller("affiliation-manager/commercial-partners")
export class CommercialPartnersController {
    constructor(private readonly commercialPartnersService: CommercialPartnersService){}

    @Get("all")
    async getAllPartners() {
        return await this.commercialPartnersService.getAllPartners();
    }

    @Post("validate-links")
    async validateDirectPartnersLinks() {
        return await this.commercialPartnersService.validateDirectPartnersLinks();
    }

    @Get(":id/payment-orders")
    async getPaymentOrdersHistory(@Param("id") id: string) {
        return await this.commercialPartnersService.getPaymentOrdersHistory(id);
    }

    @Post(":id/validate-link")
    async validateDirectPartnerLink(@Param("id") id: string) {
        return await this.commercialPartnersService.validateDirectPartnerLink(id);
    }

    @Get(":id")
    async getPartnerById(@Param("id") id: string) {
        return await this.commercialPartnersService.getPartnerById(id);
    }
}




