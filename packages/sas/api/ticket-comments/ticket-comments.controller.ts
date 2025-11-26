import {
    Controller, Post, Get, Body, Queries, Raw
} from "@cmmv/http";

import {
    TicketCommentsService
} from "./ticket-comments.service";

@Controller("affiliation-manager/ticket-comments")
export class TicketCommentsController {
    constructor(private readonly ticketCommentsService: TicketCommentsService) {}

    @Get("")
    async getByTicket(@Queries() queries: any) {
        if (!queries.ticketId) {
            throw new Error("ticketId is required");
        }
        return await this.ticketCommentsService.findByTicketId(queries.ticketId);
    }

    @Post("")
    @Raw()
    async create(@Body() body: any) {
        // O userId deve vir do body ou ser extraído do contexto de autenticação
        if (!body.userId) {
            throw new Error("userId is required");
        }
        
        console.log(`[TicketCommentsController] Criando comentário:`, {
            ticketId: body.ticketId,
            userId: body.userId,
            contentLength: body.content?.length
        });
        
        const result = await this.ticketCommentsService.create({
            ticketId: body.ticketId,
            userId: body.userId,
            content: body.content,
            isInternal: body.isInternal || false
        });
        
        console.log(`[TicketCommentsController] Resultado do service:`, {
            id: result?.id,
            userId: result?.userId,
            userEmail: result?.userEmail,
            hasUserEmail: !!result?.userEmail
        });
        
        return result;
    }
}

