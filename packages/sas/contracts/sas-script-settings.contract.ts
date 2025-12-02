import "reflect-metadata";
import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasScriptSettings',
    controllerCustomPath: 'affiliation-manager/script-settings',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_script_settings",
        databaseTimestamps: true
    }
})
export class SasScriptSettingsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    commercialPartnerId?: string; // ID do Parceiro Comercial (Rede) - null para modelo único Direto

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    defaultRoute!: string; // Rota padrão do script (ex: 'https://rt-pixel.com/r/s/p/')

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    startCode!: string; // Código de partida para sequencial (ex: 'adp15a98123453500')

    @ContractField({
        protoType: 'number',
        nullable: false,
        defaultValue: 0,
        index: true
    })
    currentSequence!: number; // Contador sequencial atual

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    description?: string; // Descrição do modelo de script (opcional)

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean; // Status ativo/inativo
}

