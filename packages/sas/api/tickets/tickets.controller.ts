import {
    Controller, Get, Post, Put, Patch, Delete,
    Queries, Body, Param
} from "@cmmv/http";

import {
    TicketsService
} from "./tickets.service";

@Controller("sas/tickets")
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Get("")
    async getAll(@Queries() queries: any) {
        return await this.ticketsService.findAll(queries || {});
    }

    @Get(":id")
    async getById(@Param("id") id: string) {
        return await this.ticketsService.findById(id);
    }

    @Post(":id/open")
    async openTicket(
        @Param("id") id: string,
        @Body() body: { userId: string }
    ) {
        return await this.ticketsService.openTicket(id, body.userId);
    }

    @Post("")
    async create(@Body() body: any) {
        return await this.ticketsService.create(body);
    }

    @Patch(":id/status")
    async updateStatus(
        @Param("id") id: string,
        @Body() body: { status: string; resolutionNote?: string; userId: string }
    ) {
        return await this.ticketsService.updateStatus(
            id,
            body.status,
            body.userId,
            body.resolutionNote
        );
    }

    @Patch(":id/reopen")
    async reopen(
        @Param("id") id: string,
        @Body() body: { userId: string; maxDaysToReopen?: number }
    ) {
        return await this.ticketsService.reopenTicket(
            id,
            body.userId,
            body.maxDaysToReopen
        );
    }

    @Patch(":id/assign")
    async assign(
        @Param("id") id: string,
        @Body() body: { assignedTo: string; userId: string; assignmentType?: 'manual' | 'automatic' | 'random' }
    ) {
        return await this.ticketsService.assignTicket(
            id,
            body.assignedTo,
            body.userId,
            body.assignmentType || 'manual'
        );
    }

    @Patch(":id/priority")
    async updatePriority(
        @Param("id") id: string,
        @Body() body: { priority: string; userId: string }
    ) {
        return await this.ticketsService.updatePriority(
            id,
            body.priority,
            body.userId
        );
    }

    @Get(":id/history")
    async getHistory(@Param("id") id: string) {
        return await this.ticketsService.getHistory(id);
    }

    @Post("check-slas")
    async checkSLAs() {
        return await this.ticketsService.checkExpiredSLAs();
    }
}

