import {
    Controller, Get, Query
} from "@cmmv/http";

import {
    ProfitSharingService
} from "./profit-sharing.service";

@Controller("affiliation-manager/profit-sharing")
export class ProfitSharingController {
    constructor(private readonly profitSharingService: ProfitSharingService){}

    @Get("monthly")
    async getMonthlyProfitSharing(
        @Query("year") year: string,
        @Query("month") month: string
    ) {
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
            throw new Error("Ano inválido. Deve estar entre 2000 e 2100");
        }

        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            throw new Error("Mês inválido. Deve estar entre 1 e 12");
        }

        const result = await this.profitSharingService.calculateMonthlyProfitSharing(yearNum, monthNum);
        return { data: result };
    }

    @Get("monthly/orders")
    async getMonthlyOrders(
        @Query("year") year: string,
        @Query("month") month: string
    ) {
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
            throw new Error("Ano inválido. Deve estar entre 2000 e 2100");
        }

        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            throw new Error("Mês inválido. Deve estar entre 1 e 12");
        }

        return await this.profitSharingService.getMonthlyOrders(yearNum, monthNum);
    }
}



