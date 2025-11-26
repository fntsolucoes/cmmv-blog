import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTicketComments',
    controllerCustomPath: 'affiliation-manager/ticket-comments',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    // Usamos um controller customizado em api/ticket-comments/ticket-comments.controller.ts
    // portanto desativamos o controller automático para evitar conflitos de rota.
    generateController: false,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_ticket_comments",
        databaseTimestamps: true
    }
})
export class SasTicketCommentsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    ticketId!: string; // ID do ticket

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    userId!: string; // ID do usuário que comentou

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: false,
    })
    content!: string; // Conteúdo do comentário

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true,
    })
    isInternal!: boolean; // Se é comentário interno (não visível ao cliente)

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    userEmail?: string; // Email do usuário (calculado, não persistido)
}

