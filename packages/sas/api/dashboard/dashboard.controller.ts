import {
    Controller, Get
} from "@cmmv/http";

import {
    DashboardService
} from "./dashboard.service";

@Controller("sas/dashboard")
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService){}

    @Get("")
    async getDashboardData() {
        const data = await this.dashboardService.getDashboardData();
        console.log('[DashboardController] Retornando dados:', data);
        // Retornar no formato { data: {...} } para consistência com outros endpoints
        return { data };
    }
}

