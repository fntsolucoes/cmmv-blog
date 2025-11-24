import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import {
    UsersService
} from "../users/users.service";

@Service()
export class TicketCommentsService {
    constructor(private readonly usersService: UsersService) {}

    /**
     * Buscar comentários de um ticket com nomes dos usuários
     */
    async findByTicketId(ticketId: string) {
        const CommentsEntity = Repository.getEntity("SasTicketCommentsEntity");
        const result = await Repository.findAll(CommentsEntity, { ticketId }, [], {
            order: {
                createdAt: 'ASC'
            }
        });

        const comments = result?.data || [];
        
        // Enriquecer comentários com emails dos usuários
        const enrichedComments = await Promise.all(
            comments.map(async (comment: any) => {
                const userEmail = await this.usersService.getUserName(comment.userId);
                return {
                    ...comment,
                    userEmail: userEmail
                };
            })
        );

        return {
            ...result,
            data: enrichedComments
        };
    }

    /**
     * Criar comentário e registrar no histórico
     */
    async create(data: {
        ticketId: string;
        userId: string;
        content: string;
        isInternal?: boolean;
    }) {
        const CommentsEntity = Repository.getEntity("SasTicketCommentsEntity");
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        
        // Verificar se o ticket existe
        const ticket = await Repository.findOne(TicketsEntity, { id: data.ticketId });
        if (!ticket) {
            throw new Error("Ticket not found");
        }

        // Criar comentário
        const insertResult = await Repository.insert(CommentsEntity, {
            ticketId: data.ticketId,
            userId: data.userId,
            content: data.content,
            isInternal: data.isInternal || false
        });
        
        // Normalizar estrutura do retorno (pode ser { data: {...} } ou {...} diretamente)
        const comment = insertResult?.data || insertResult;
        
        console.log(`[TicketCommentsService] Estrutura do insertResult:`, JSON.stringify(insertResult, null, 2));
        console.log(`[TicketCommentsService] Comentário normalizado:`, comment);

        // Registrar no histórico do ticket
        const HistoryEntity = Repository.getEntity("SasTicketHistoryEntity");
        await Repository.insert(HistoryEntity, {
            ticketId: data.ticketId,
            userId: data.userId,
            action: 'comment_added',
            description: `Comentário adicionado${data.isInternal ? ' (interno)' : ''}: ${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}`,
            field: 'comments',
            newValue: comment.id
        });

        // Se o ticket não estiver atribuído, atribuir ao usuário que comentou
        if (!ticket.assignedTo) {
            // Obter email do usuário
            const userEmail = await this.usersService.getUserName(data.userId);

            await Repository.update(TicketsEntity, { id: data.ticketId }, {
                assignedTo: userEmail
            });

            // Registrar atribuição no histórico
            await Repository.insert(HistoryEntity, {
                ticketId: data.ticketId,
                userId: data.userId,
                action: 'assigned',
                description: `Ticket atribuído automaticamente ao usuário ${userEmail} (primeiro comentário)`,
                field: 'assignedTo',
                oldValue: null,
                newValue: userEmail
            });
        }

        // Retornar comentário com email do usuário
        console.log(`[TicketCommentsService] Buscando userEmail para userId: ${data.userId}`);
        
        let userEmail: string;
        try {
            console.log(`[TicketCommentsService] usersService disponível:`, !!this.usersService);
            
            userEmail = await this.usersService.getUserName(data.userId);
            // Garantir que não seja null ou undefined
            if (!userEmail || userEmail === null || userEmail === undefined || userEmail === 'null' || userEmail === 'undefined') {
                console.warn(`[TicketCommentsService] ⚠️ getUserName retornou valor inválido: ${userEmail}, usando userId como fallback`);
                userEmail = data.userId;
            }
        } catch (error) {
            console.error(`[TicketCommentsService] ❌ Erro ao buscar email:`, error);
            userEmail = data.userId; // Fallback seguro
        }
        
        console.log(`[TicketCommentsService] userEmail obtido: ${userEmail} (tipo: ${typeof userEmail})`);
        
        // Garantir estrutura consistente do retorno
        // Criar objeto explícito para evitar problemas com spread operator
        const result: any = {
            id: comment?.id,
            ticketId: comment?.ticketId || data.ticketId,
            userId: comment?.userId || data.userId,
            content: comment?.content || data.content,
            isInternal: comment?.isInternal !== undefined ? comment.isInternal : (data.isInternal || false),
            createdAt: comment?.createdAt,
            updatedAt: comment?.updatedAt,
            userEmail: userEmail || data.userId  // Campo calculado, sempre presente (garantir string)
        };
        
        console.log(`[TicketCommentsService] Comentário criado, retornando:`, {
            id: result.id,
            ticketId: result.ticketId,
            userId: result.userId,
            userEmail: result.userEmail,
            content: result.content?.substring(0, 50),
            isInternal: result.isInternal,
            hasUserEmail: !!result.userEmail
        });
        
        return result;
    }
}

