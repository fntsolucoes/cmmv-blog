import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTags',
    controllerCustomPath: 'affiliation-manager/tags',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_tags",
        databaseTimestamps: true
    }
})
export class SasTagsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string; // Nome da Tag (2-255 caracteres, sem caracteres orientais)

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    description?: string; // Descrição da tag (opcional)

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    color?: string; // Cor da tag (hexadecimal, ex: #FF5733)

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean; // Status ativo/inativo
}

