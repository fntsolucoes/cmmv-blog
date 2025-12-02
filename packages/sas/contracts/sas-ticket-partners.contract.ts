import "reflect-metadata";
import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTicketPartners',
    controllerCustomPath: 'affiliation-manager/ticket-partners',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: false, // Desabilitado porque temos controller customizado
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_ticket_partners",
        databaseTimestamps: true
    }
})
export class SasTicketPartnersContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string; // Nome do parceiro (ex: "1001", "Ixan", "Renan")

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    displayName?: string; // Nome de exibição (ex: "1001 (padrão)")

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true,
    })
    isDefault!: boolean; // Se é o parceiro padrão

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true,
    })
    active!: boolean; // Se está ativo
}

