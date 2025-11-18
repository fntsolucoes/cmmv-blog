import {
    Controller, Get, Param
} from "@cmmv/http";

import {
    CampaignsService
} from "./campaigns.service";

@Controller("sas/campaigns")
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService){}

    @Get("partner/:partnerId/active")
    async getActiveCampaignsByPartner(@Param("partnerId") partnerId: string) {
        return await this.campaignsService.getActiveCampaignsByPartner(partnerId);
    }

    @Get("partner/:partnerId/all")
    async getAllCampaignsByPartner(@Param("partnerId") partnerId: string) {
        return await this.campaignsService.getAllCampaignsByPartner(partnerId);
    }

    @Get("all")
    async getAllCampaigns() {
        return await this.campaignsService.getAllCampaigns();
    }
}




