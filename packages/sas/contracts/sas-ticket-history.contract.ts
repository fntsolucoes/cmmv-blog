import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTicketHistory',
    controllerCustomPath: 'affiliation-manager/ticket-history',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_ticket_history",
        databaseTimestamps: true
    }
})
export class SasTicketHistoryContract extends AbstractContract {
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
    userId!: string; // ID do usuário responsável pela ação

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    action!: string; // Tipo de ação (created, status_changed, assigned, priority_changed, etc)

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    field?: string; // Campo alterado (se aplicável)

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    oldValue?: string; // Valor anterior (se aplicável)

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    newValue?: string; // Novo valor (se aplicável)

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    description!: string; // Descrição da ação
}

