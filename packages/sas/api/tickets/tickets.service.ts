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
export class TicketsService {
    constructor(private readonly usersService: UsersService) {}
    // Configuração de SLA por prioridade (em horas)
    private readonly SLA_CONFIG = {
        Alta: {
            responseTime: 1, // 1 hora para primeira resposta
            resolutionTime: 4 // 4 horas para resolução
        },
        Normal: {
            responseTime: 4, // 4 horas para primeira resposta
            resolutionTime: 24 // 24 horas para resolução
        },
        Média: {
            responseTime: 4, // 4 horas para primeira resposta
            resolutionTime: 24 // 24 horas para resolução
        },
        Baixa: {
            responseTime: 12, // 12 horas para primeira resposta
            resolutionTime: 72 // 72 horas para resolução
        }
    };

    // Palavras-chave para priorização automática
    private readonly PRIORITY_KEYWORDS = {
        Alta: ['erro crítico', 'sistema parado', 'crítico', 'urgente', 'emergência', 'fora do ar'],
        Baixa: ['dúvida', 'informação', 'consulta', 'pergunta']
    };

    // Regras de transição de status
    private readonly STATUS_TRANSITIONS: Record<string, string[]> = {
        'Aberto': ['Em andamento', 'Cancelado'],
        'Em andamento': ['Aguardando resposta do cliente', 'Pausado', 'Encerrado', 'Cancelado'],
        'Aguardando resposta do cliente': ['Em andamento', 'Encerrado'],
        'Pausado': ['Em andamento', 'Cancelado'],
        'Encerrado': [], // Não pode ser modificado, apenas reaberto
        'Cancelado': [] // Não pode ser modificado
    };

    /**
     * Gerar número único sequencial do ticket baseado no tipo
     * 
     * Prefixos por área:
     * - 'activation' → ACT-000001
     * - 'script-creation' → SCR-000001
     * - 'geral' → TKT-000001 (tickets gerais)
     */
    private async generateTicketNumber(ticketType: 'activation' | 'script-creation' | 'geral' | string = 'geral'): Promise<string> {
        // Normalizar ticketType: garantir que seja um dos valores válidos
        let normalizedType: 'activation' | 'script-creation' | 'geral' = 'geral';
        if (ticketType === 'activation' || ticketType === 'script-creation' || ticketType === 'geral') {
            normalizedType = ticketType;
        } else if (ticketType === null || ticketType === undefined || ticketType === '' || ticketType === 'null') {
            // Valores antigos ou inválidos → tratar como 'geral'
            normalizedType = 'geral';
        }

        try {
            
            // Definir prefixo baseado no tipo de ticket
            let prefix: string;
            switch (normalizedType) {
                case 'activation':
                    prefix = 'ACT';
                    break;
                case 'script-creation':
                    prefix = 'SCR';
                    break;
                case 'geral':
                    prefix = 'TKT';
                    break;
                default:
                    prefix = 'TKT'; // Fallback para geral
            }

            const TicketsEntity = Repository.getEntity("SasTicketsEntity");
            
            // Buscar tickets do mesmo tipo, ordenados por data de criação (mais recente primeiro)
            const query: any = {
                ticketType: normalizedType
            };

            const result = await Repository.findAll(TicketsEntity, query, [], {
                order: {
                    createdAt: 'DESC'
                },
                take: 1  // Apenas o mais recente do mesmo tipo
            });

            // Pegar o primeiro ticket (mais recente do mesmo tipo)
            const lastTicket = result?.data && Array.isArray(result.data) && result.data.length > 0 
                ? result.data[0] 
                : null;

            if (!lastTicket || !lastTicket.ticketNumber) {
                const firstNumber = `${prefix}-000001`;
                console.log(`[generateTicketNumber] Nenhum ticket anterior encontrado para tipo '${normalizedType}', iniciando com ${firstNumber}`);
                return firstNumber;
            }

            console.log(`[generateTicketNumber] Último ticket encontrado para tipo '${normalizedType}':`, {
                id: lastTicket.id,
                ticketNumber: lastTicket.ticketNumber,
                ticketType: lastTicket.ticketType,
                createdAt: lastTicket.createdAt
            });

            // Extrair o número do formato PREFIX-XXXXXX (ex: ACT-000001, SCR-000001, TKT-000001)
            const match = lastTicket.ticketNumber.match(/^([A-Z]+)-(\d+)$/);
            if (!match || !match[1] || !match[2]) {
                console.warn(`[generateTicketNumber] Formato de ticketNumber inválido: ${lastTicket.ticketNumber}`);
                return `${prefix}-000001`;
            }

            // Verificar se o prefixo do último ticket corresponde ao tipo atual
            const lastPrefix = match[1];
            if (lastPrefix !== prefix) {
                // Se o prefixo não corresponde, começar do 1 para este tipo
                console.log(`[generateTicketNumber] Prefixo diferente encontrado (${lastPrefix} vs ${prefix}), iniciando sequência do tipo ${prefix}`);
                return `${prefix}-000001`;
            }

            const lastNumber = parseInt(match[2], 10);
            
            if (isNaN(lastNumber)) {
                console.warn(`[generateTicketNumber] Não foi possível parsear o número: ${match[2]}`);
                return `${prefix}-000001`;
            }
            
            const nextNumber = (lastNumber + 1).toString().padStart(6, '0');
            const ticketNumber = `${prefix}-${nextNumber}`;
            
            console.log(`[generateTicketNumber] Novo número gerado para tipo '${normalizedType}': ${ticketNumber}`);
            
            if (!ticketNumber || ticketNumber.trim() === '') {
                throw new Error('Generated ticket number is empty');
            }
            
            return ticketNumber;
        } catch (error) {
            console.error(`[generateTicketNumber] Erro ao gerar número do ticket para tipo '${normalizedType}':`, error);
            // Fallback para garantir que sempre retorne um número
            const prefix = normalizedType === 'activation' ? 'ACT' : normalizedType === 'script-creation' ? 'SCR' : 'TKT';
            return `${prefix}-000001`;
        }
    }

    /**
     * Calcular prioridade automática baseada em palavras-chave
     */
    private calculateAutoPriority(description: string): string {
        const descLower = description.toLowerCase();
        
        for (const [priority, keywords] of Object.entries(this.PRIORITY_KEYWORDS)) {
            if (keywords.some(keyword => descLower.includes(keyword))) {
                return priority;
            }
        }
        
        return 'Normal'; // Prioridade padrão
    }

    /**
     * Calcular prazos de SLA
     */
    private calculateSLADeadlines(priority: string): { responseDeadline: Date; resolutionDeadline: Date } {
        const config = this.SLA_CONFIG[priority as keyof typeof this.SLA_CONFIG] || this.SLA_CONFIG.Normal;
        const now = new Date();
        
        const responseDeadline = new Date(now.getTime() + config.responseTime * 60 * 60 * 1000);
        const resolutionDeadline = new Date(now.getTime() + config.resolutionTime * 60 * 60 * 1000);
        
        return { responseDeadline, resolutionDeadline };
    }

    /**
     * Validar transição de status
     */
    private validateStatusTransition(currentStatus: string, newStatus: string): boolean {
        const allowedTransitions = this.STATUS_TRANSITIONS[currentStatus] || [];
        return allowedTransitions.includes(newStatus);
    }


    /**
     * Registrar histórico do ticket
     */
    private async logHistory(
        ticketId: string,
        userId: string,
        action: string,
        description: string,
        field?: string,
        oldValue?: string,
        newValue?: string
    ): Promise<void> {
        const HistoryEntity = Repository.getEntity("SasTicketHistoryEntity");
        await Repository.insert(HistoryEntity, {
            ticketId,
            userId,
            action,
            field,
            oldValue,
            newValue,
            description
        });
    }

    /**
     * Criar novo ticket
     */
    async create(data: {
        title?: string; // Opcional, será gerado a partir da campanha se não fornecido
        description: string;
        ticketType?: 'activation' | 'script-creation' | 'geral' | string; // Padrão: 'geral'
        campaignId?: string; // Opcional para tickets gerais, obrigatório para activation/script-creation
        activationType?: string; // Apenas para 'activation'
        partner?: string; // Apenas para 'activation'
        priority?: string;
        createdBy: string;
        queueId?: string;
        assignedTo?: string;
    }) {
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        
        // Normalizar ticketType: garantir que seja um dos valores válidos
        let normalizedTicketType: 'activation' | 'script-creation' | 'geral' = 'geral';
        if (data.ticketType !== undefined && data.ticketType !== null && data.ticketType !== '') {
            if (data.ticketType === 'activation' || data.ticketType === 'script-creation' || data.ticketType === 'geral') {
                normalizedTicketType = data.ticketType;
            } else if (data.ticketType === 'null' || data.ticketType === null) {
                // Valores antigos → converter para 'geral'
                normalizedTicketType = 'geral';
            } else {
                throw new Error("Ticket type must be 'activation', 'script-creation' or 'geral'");
            }
        }
        
        // Validar tipo de ticket (se fornecido, deve ser válido)
        if (normalizedTicketType === 'activation' || normalizedTicketType === 'script-creation') {
            // Para tickets específicos (activation/script-creation), campanha é obrigatória
            if (!data.campaignId) {
                throw new Error("Campaign ID is required for activation and script-creation tickets");
            }
        }

        // Para tickets gerais, usar título fornecido diretamente
        let title = data.title;
        let campaign = null;
        let isDirectPartner = false;
        let directPartner = null;

        // Se for ticket específico (activation ou script-creation), processar campanha
        if ((normalizedTicketType === 'activation' || normalizedTicketType === 'script-creation') && data.campaignId) {
            const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
            campaign = await Repository.findOne(CampaignsEntity, { id: data.campaignId });

            // Se não encontrou campanha, pode ser um parceiro direto
            if (!campaign) {
                const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
                directPartner = await Repository.findOne(CommercialPartnersEntity, { id: data.campaignId });
                
                if (directPartner && directPartner.partnerType === 'Direto') {
                    isDirectPartner = true;
                } else {
                    throw new Error("Campaign not found");
                }
            }

            // Buscar parceiro comercial para gerar título (se não fornecido)
            if (!title) {
                if (isDirectPartner && directPartner) {
                    // É um parceiro direto
                    title = `${directPartner.name} - Direto`;
                } else if (campaign) {
                    // É uma campanha normal
                    const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
                    const partner = await Repository.findOne(CommercialPartnersEntity, { id: campaign.commercialPartnerId });
                    title = `${campaign.name}${partner ? ` - ${partner.name}` : ''}`;
                }
            }
        } else if (normalizedTicketType === 'geral' && !title) {
            // Para tickets gerais, título é obrigatório
            throw new Error("Title is required for general tickets");
        }

        // Validar campos específicos do tipo 'activation'
        if (normalizedTicketType === 'activation') {
            if (!data.activationType) {
                throw new Error("Activation type is required for activation tickets");
            }
            const validActivationTypes = ['Ativação', 'Adição', 'Pausa', 'substituição', 'Ajustes', 'Aumento de Trafego'];
            if (!validActivationTypes.includes(data.activationType)) {
                throw new Error(`Invalid activation type. Must be one of: ${validActivationTypes.join(', ')}`);
            }

            // Validação dinâmica de parceiro usando SasTicketPartnersEntity
            const TicketPartnersEntity = Repository.getEntity("SasTicketPartnersEntity");

            // Se não vier parceiro do front, tentar usar o parceiro padrão ativo
            if (!data.partner) {
                const defaultPartner = await Repository.findOne(TicketPartnersEntity, {
                    isDefault: true,
                    active: true
                });

                if (defaultPartner) {
                    data.partner = defaultPartner.name;
                }
            }

            // Se ainda existir valor em data.partner, garantir que ele exista e esteja ativo na configuração
            if (data.partner) {
                const existingPartner = await Repository.findOne(TicketPartnersEntity, {
                    name: data.partner,
                    active: true
                });

                if (!existingPartner) {
                    throw new Error("Invalid partner. Partner not found or inactive in ticket partners configuration");
                }
            }
        }

        const queueId = data.queueId;

        // Calcular prioridade (automática se não fornecida, padrão: Normal)
        const priority = data.priority || this.calculateAutoPriority(data.description) || 'Normal';

        // Calcular prazos de SLA
        const { responseDeadline, resolutionDeadline } = this.calculateSLADeadlines(priority);

        // Gerar número único baseado no tipo de ticket
        const ticketNumber = await this.generateTicketNumber(normalizedTicketType);
        
        console.log('Generated ticket number:', ticketNumber); // Debug
        
        if (!ticketNumber || ticketNumber.trim() === '') {
            throw new Error('Failed to generate ticket number');
        }

        // Preparar payload completo
        const payload: any = {
            ticketNumber: String(ticketNumber).trim(), // Garantir que é string e não está vazio
            title: title,
            description: data.description,
            ticketType: normalizedTicketType, // 'activation', 'script-creation' ou 'geral'
            campaignId: data.campaignId || null,
            activationType: data.activationType || null,
            partner: data.partner || null,
            categoryId: null,
            subcategoryId: null,
            priority,
            status: 'Não Iniciado',
            createdBy: data.createdBy,
            assignedTo: data.assignedTo || null,
            queueId: queueId || null,
            slaResponseDeadline: responseDeadline,
            slaResolutionDeadline: resolutionDeadline,
            slaExpired: false,
            requiresClientApproval: false,
            clientApproved: false,
            permanentlyResolved: false,
            reopenCount: 0
        };

        // Validar que ticketNumber está presente
        if (!payload.ticketNumber) {
            throw new Error('ticketNumber is required but was not generated');
        }

        // Criar ticket
        const ticket = await Repository.insert(TicketsEntity, payload);

        // Registrar histórico
        await this.logHistory(
            ticket.id,
            data.createdBy,
            'created',
            `Ticket ${ticketNumber} criado (Tipo: ${data.ticketType})`
        );

        return ticket;
    }

    /**
     * Atualizar status do ticket
     */
    async updateStatus(
        ticketId: string,
        newStatus: string,
        userId: string,
        resolutionNote?: string
    ) {
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        const ticket = await Repository.findOne(TicketsEntity, { id: ticketId });

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        // Validar transição (novos status permitem qualquer transição entre eles)
        const validStatuses = ['Não Iniciado', 'Em andamento', 'Feito', 'Com Pendência'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // Validar se status "Feito" requer nota de resolução
        if (newStatus === 'Feito' && !resolutionNote) {
            throw new Error("Resolution note is required when marking ticket as 'Feito'");
        }

        const updates: any = {
            status: newStatus
        };

        // Atualizar datas conforme status
        if (newStatus === 'Feito') {
            updates.closedAt = new Date();
            updates.resolvedAt = new Date();
            updates.resolutionNote = resolutionNote;
        } else if (newStatus === 'Em andamento' && !ticket.firstResponseAt) {
            updates.firstResponseAt = new Date();
        }

        await Repository.update(TicketsEntity, { id: ticketId }, updates);

        // Registrar histórico
        await this.logHistory(
            ticketId,
            userId,
            'status_changed',
            `Status alterado de ${ticket.status} para ${newStatus}`,
            'status',
            ticket.status,
            newStatus
        );

        return await Repository.findOne(TicketsEntity, { id: ticketId });
    }

    /**
     * Reabrir ticket
     */
    async reopenTicket(
        ticketId: string,
        userId: string,
        maxDaysToReopen: number = 30
    ) {
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        const ticket = await Repository.findOne(TicketsEntity, { id: ticketId });

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        // Permitir reabertura apenas de tickets com status "Feito"
        if (ticket.status !== 'Feito') {
            throw new Error("Only tickets with status 'Feito' can be reopened");
        }

        if (ticket.permanentlyResolved) {
            throw new Error("Cannot reopen permanently resolved tickets");
        }

        if (!ticket.closedAt) {
            throw new Error("Ticket has no closing date");
        }

        // Verificar se ultrapassou o prazo
        const daysSinceClosed = Math.floor(
            (new Date().getTime() - new Date(ticket.closedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceClosed > maxDaysToReopen) {
            throw new Error(`Ticket cannot be reopened after ${maxDaysToReopen} days`);
        }

        // Recalcular SLA
        const { responseDeadline, resolutionDeadline } = this.calculateSLADeadlines(ticket.priority);

        await Repository.update(TicketsEntity, { id: ticketId }, {
            status: 'Não Iniciado',
            reopenedAt: new Date(),
            reopenCount: (ticket.reopenCount || 0) + 1,
            slaResponseDeadline: responseDeadline,
            slaResolutionDeadline: resolutionDeadline,
            slaExpired: false,
            closedAt: null,
            resolvedAt: null
        });

        // Registrar histórico
        await this.logHistory(
            ticketId,
            userId,
            'reopened',
            `Ticket reaberto (${ticket.reopenCount + 1}ª vez)`
        );

        return await Repository.findOne(TicketsEntity, { id: ticketId });
    }

    /**
     * Atribuir ticket
     */
    async assignTicket(
        ticketId: string,
        assignedTo: string,
        userId: string,
        assignmentType: 'manual' | 'automatic' | 'random' = 'manual'
    ) {
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        const ticket = await Repository.findOne(TicketsEntity, { id: ticketId });

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        // Usar UsersService para buscar o email do usuário
        // O service tenta buscar em UserEntity e ProfilesEntity, e trata casos especiais
        const userEmail = await this.usersService.getUserName(assignedTo);

        await Repository.update(TicketsEntity, { id: ticketId }, {
            assignedTo: userEmail
        });

        // Registrar histórico
        await this.logHistory(
            ticketId,
            userId,
            'assigned',
            `Ticket atribuído a usuário ${userEmail} (${assignmentType})`,
            'assignedTo',
            ticket.assignedTo || 'N/A',
            userEmail
        );

        return await Repository.findOne(TicketsEntity, { id: ticketId });
    }

    /**
     * Atualizar prioridade
     */
    async updatePriority(
        ticketId: string,
        newPriority: string,
        userId: string
    ) {
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        const ticket = await Repository.findOne(TicketsEntity, { id: ticketId });

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        if (!['Alta', 'Normal', 'Média', 'Baixa'].includes(newPriority)) {
            throw new Error("Invalid priority");
        }

        // Recalcular SLA com nova prioridade
        const { responseDeadline, resolutionDeadline } = this.calculateSLADeadlines(newPriority);

        await Repository.update(TicketsEntity, { id: ticketId }, {
            priority: newPriority,
            slaResponseDeadline: responseDeadline,
            slaResolutionDeadline: resolutionDeadline
        });

        // Registrar histórico
        await this.logHistory(
            ticketId,
            userId,
            'priority_changed',
            `Prioridade alterada de ${ticket.priority} para ${newPriority}`,
            'priority',
            ticket.priority,
            newPriority
        );

        return await Repository.findOne(TicketsEntity, { id: ticketId });
    }

    /**
     * Verificar e atualizar SLAs expirados
     */
    async checkExpiredSLAs() {
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        const now = new Date();

        // Buscar tickets com SLA expirado mas não marcados
        const expiredTicketsResult = await Repository.findAll(TicketsEntity, {
            slaExpired: false,
            status: { $ne: 'Encerrado' }
        }, []);
        const expiredTickets = expiredTicketsResult?.data || [];

        const updated: string[] = [];

        for (const ticket of expiredTickets) {
            const responseExpired = ticket.slaResponseDeadline && new Date(ticket.slaResponseDeadline) < now;
            const resolutionExpired = ticket.slaResolutionDeadline && new Date(ticket.slaResolutionDeadline) < now;

            if (responseExpired || resolutionExpired) {
                // Escalonar prioridade se não for Alta
                let newPriority = ticket.priority;
                if (ticket.priority === 'Baixa') {
                    newPriority = 'Média';
                } else if (ticket.priority === 'Média') {
                    newPriority = 'Alta';
                }

                // Recalcular SLA
                const { responseDeadline, resolutionDeadline } = this.calculateSLADeadlines(newPriority);

                await Repository.update(TicketsEntity, { id: ticket.id }, {
                    slaExpired: true,
                    priority: newPriority,
                    slaResponseDeadline: responseDeadline,
                    slaResolutionDeadline: resolutionDeadline
                });

                // Registrar histórico
                await this.logHistory(
                    ticket.id,
                    'system',
                    'sla_expired',
                    `SLA expirado. Prioridade escalonada para ${newPriority}`
                );

                updated.push(ticket.id);
            }
        }

        return { updated: updated.length, ticketIds: updated };
    }

    /**
     * Buscar tickets com filtros
     */
    async findAll(filters: {
        status?: string;
        priority?: string;
        categoryId?: string;
        assignedTo?: string;
        createdBy?: string;
        queueId?: string;
        slaExpired?: boolean;
        ticketType?: 'activation' | 'script-creation' | 'geral';
        limit?: number;
        offset?: number;
    }) {
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        const query: any = {};

        if (filters.status) query.status = filters.status;
        if (filters.priority) query.priority = filters.priority;
        if (filters.categoryId) query.categoryId = filters.categoryId;
        if (filters.assignedTo) query.assignedTo = filters.assignedTo;
        if (filters.createdBy) query.createdBy = filters.createdBy;
        if (filters.queueId) query.queueId = filters.queueId;
        if (filters.slaExpired !== undefined) query.slaExpired = filters.slaExpired;
        
        // Filtrar por tipo de ticket (isolamento entre áreas)
        if (filters.ticketType !== undefined && filters.ticketType !== null && filters.ticketType !== '') {
            // Normalizar: converter valores antigos ('null') para 'geral'
            let ticketType = filters.ticketType;
            if (ticketType === 'null') {
                ticketType = 'geral';
            }
            
            if (ticketType === 'activation' || ticketType === 'script-creation' || ticketType === 'geral') {
                query.ticketType = ticketType;
            }
        }

        const queryParams: any = {
            ...query
        };

        if (filters.limit) {
            queryParams.limit = filters.limit;
        } else {
            queryParams.limit = 50;
        }

        if (filters.offset) {
            queryParams.offset = filters.offset;
        }

        const result = await Repository.findAll(TicketsEntity, queryParams, [], {
            order: {
                createdAt: 'DESC'
            }
        });

        return result;
    }

    /**
     * Buscar ticket por ID
     */
    async findById(id: string) {
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        return await Repository.findOne(TicketsEntity, { id });
    }

    /**
     * Abrir ticket (atribuir ao usuário que abriu se não estiver atribuído)
     */
    async openTicket(ticketId: string, userId: string) {
        const TicketsEntity = Repository.getEntity("SasTicketsEntity");
        const ticket = await Repository.findOne(TicketsEntity, { id: ticketId });

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        // Se o ticket não estiver atribuído, atribuir ao usuário que abriu
        if (!ticket.assignedTo) {
            // Obter email do usuário
            const userEmail = await this.usersService.getUserName(userId);
            
            await Repository.update(TicketsEntity, { id: ticketId }, {
                assignedTo: userEmail
            });

            // Registrar atribuição no histórico
            await this.logHistory(
                ticketId,
                userId,
                'assigned',
                `Ticket atribuído automaticamente ao usuário ${userEmail} (abertura do ticket)`,
                'assignedTo',
                null,
                userEmail
            );

            // Retornar ticket atualizado
            return await Repository.findOne(TicketsEntity, { id: ticketId });
        }

        return ticket;
    }

    /**
     * Buscar histórico do ticket
     */
    async getHistory(ticketId: string) {
        const HistoryEntity = Repository.getEntity("SasTicketHistoryEntity");
        const result = await Repository.findAll(HistoryEntity, { ticketId }, [], {
            order: {
                createdAt: 'ASC'
            }
        });
        return result;
    }
}

