import {
    Controller, Get, Param, Post
} from "@cmmv/http";

import {
    CampaignsService
} from "./campaigns.service";

@Controller("affiliation-manager/campaigns")
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

    @Post("validate-links")
    async validateAllActiveCampaignsLinks() {
        return await this.campaignsService.validateActiveCampaignsLinks();
    }

    @Post(":campaignId/validate-link")
    async validateCampaignLink(@Param("campaignId") campaignId: string) {
        return await this.campaignsService.validateCampaignLink(campaignId);
    }
}




