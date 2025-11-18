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
}




