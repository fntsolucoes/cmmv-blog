import "reflect-metadata";
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
    generateController: false, // Desabilitado porque temos controller customizado
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
        nullable: true,
        index: true,
    })
    name?: string; // Nome da Tag (opcional, não usado mais)

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    description?: string; // Descrição da tag (opcional)


    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    scriptSettingId?: string; // ID do modelo de script utilizado

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    campaignIds?: string; // IDs das campanhas (JSON array)

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    generatedScript?: string; // Script gerado automaticamente

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    generatedCode?: string; // Código sequencial gerado

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    sellerUrl?: string; // URL do seller onde a tag será instalada

    @ContractField({
        protoType: 'string',
        nullable: true,
        defaultValue: 'Não verificada',
    })
    scriptStatus?: string; // Status do script: Implementado, Caiu, Pendente de instalar, Não verificada

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean; // Status ativo/inativo
}

