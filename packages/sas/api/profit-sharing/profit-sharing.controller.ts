import {
    Controller, Get, Query
} from "@cmmv/http";

import {
    ProfitSharingService
} from "./profit-sharing.service";

@Controller("sas/profit-sharing")
export class ProfitSharingController {
    constructor(private readonly profitSharingService: ProfitSharingService){}

    @Get("monthly")
    async getMonthlyProfitSharing(
        @Query("year") year: string,
        @Query("month") month: string
    ) {
        return await this.profitSharingService.calculateMonthlyProfitSharing(
            parseInt(year),
            parseInt(month)
        );
    }
}

