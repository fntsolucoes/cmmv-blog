import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTicketQueues',
    controllerCustomPath: 'affiliation-manager/ticket-queues',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_ticket_queues",
        databaseTimestamps: true
    }
})
export class SasTicketQueuesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string; // Nome da fila

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    description?: string; // Descrição da fila

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    assignmentRule!: string; // manual, automatic, random

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true,
    })
    active!: boolean; // Se a fila está ativa
}

