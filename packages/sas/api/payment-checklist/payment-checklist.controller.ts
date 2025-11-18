import {
    Controller, Get, Post, Body, Query
} from "@cmmv/http";

import {
    PaymentChecklistService
} from "./payment-checklist.service";

@Controller("sas/payment-checklist")
export class PaymentChecklistController {
    constructor(private readonly paymentChecklistService: PaymentChecklistService){}

    /**
     * Buscar checklist por ano e mês
     */
    @Get("")
    async getChecklist(
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

        return await this.paymentChecklistService.getChecklistByMonth(yearNum, monthNum);
    }

    /**
     * Salvar item do checklist
     */
    @Post("")
    async saveItem(@Body() body: any) {
        return await this.paymentChecklistService.saveChecklistItem(body);
    }

    /**
     * Buscar ordens de pagamento disponíveis
     */
    @Get("available-orders")
    async getAvailableOrders(
        @Query("commercialPartnerId") commercialPartnerId: string,
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

        return await this.paymentChecklistService.getAvailablePaymentOrders(
            commercialPartnerId,
            yearNum,
            monthNum
        );
    }
}

