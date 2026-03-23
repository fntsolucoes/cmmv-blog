import "reflect-metadata";
import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTickets',
    controllerCustomPath: 'affiliation-manager/tickets',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: false, // Desabilitado porque temos controller customizado
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_tickets",
        databaseTimestamps: true
    }
})
export class SasTicketsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    ticketNumber!: string; // Número único sequencial do ticket

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    title!: string; // Título do ticket

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: false,
    })
    description!: string; // Descrição do ticket

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    categoryId?: string; // ID da categoria (opcional)

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    subcategoryId?: string; // ID da subcategoria (opcional)

    @ContractField({
        protoType: 'string',
        nullable: false,
        defaultValue: 'Normal',
        index: true,
    })
    priority!: string; // Alta, Normal, Média, Baixa

    @ContractField({
        protoType: 'string',
        nullable: false,
        defaultValue: 'Não Iniciado',
        index: true,
    })
    status!: string; // Não Iniciado, Em andamento, Concluído, Com Pendência, Cancelado

    @ContractField({
        protoType: 'string',
        nullable: true, // permite valores antigos nulos no banco
        defaultValue: 'geral',
        index: true,
    })
    ticketType?: string; // 'activation', 'script-creation' ou 'geral' (tickets gerais)

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    campaignId?: string; // ID da campanha vinculada

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    activationType?: string; // Adição, Pausa, substituição, Ajustes, Aumento de Trafego (apenas para tipo 'activation')

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    partner?: string; // 1001 (padrão), Ixan, Renan (apenas para tipo 'activation')

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    createdBy!: string; // ID do usuário que criou o ticket

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    assignedTo?: string; // ID do atendente responsável

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    queueId?: string; // ID da fila de atendimento

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    firstResponseAt?: Date; // Data/hora da primeira resposta

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    resolvedAt?: Date; // Data/hora de resolução

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    closedAt?: Date; // Data/hora de encerramento

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    slaResponseDeadline?: Date; // Prazo para primeira resposta (SLA)

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    slaResolutionDeadline?: Date; // Prazo para resolução (SLA)

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true,
    })
    slaExpired!: boolean; // Indica se o SLA expirou

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    resolutionNote?: string; // Justificativa de encerramento/resolução

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true,
    })
    requiresClientApproval!: boolean; // Se requer aprovação do cliente

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true,
    })
    clientApproved!: boolean; // Se foi aprovado pelo cliente

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true,
    })
    permanentlyResolved!: boolean; // Se foi marcado como resolvido definitivamente

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    reopenedAt?: Date; // Data da última reabertura

    @ContractField({
        protoType: 'integer',
        nullable: false,
        defaultValue: 0,
        index: false,
    })
    reopenCount!: number; // Contador de reaberturas
}

