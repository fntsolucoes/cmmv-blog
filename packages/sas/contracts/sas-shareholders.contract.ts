import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasShareholders',
    controllerCustomPath: 'sas/shareholders',
    protoPackage: 'sas',
    subPath: '/sas',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_shareholders",
        databaseTimestamps: true
    }
})
export class SasShareholdersContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string; // Nome do Sócio

    @ContractField({
        protoType: 'double',
        nullable: false,
        index: true,
    })
    percentage!: number; // Porcentagem de participação (0-100)

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;
}






