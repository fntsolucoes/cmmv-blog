import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasCampaigns',
    controllerCustomPath: 'sas/campaigns',
    protoPackage: 'sas',
    subPath: '/sas',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_campaigns",
        databaseTimestamps: true
    }
})
export class SasCampaignsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    commercialPartnerId!: string; // ID do Parceiro Comercial

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string; // Nome da Campanha (2-255 caracteres, sem caracteres orientais)

    @ContractField({
        protoType: 'date',
        nullable: false,
        index: true,
    })
    startDate!: Date; // Data de Início (formato: YYYY-MM-DD)

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    endDate?: Date; // Data de Fim (formato: YYYY-MM-DD) - opcional

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    script?: string; // Código do script da campanha

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    scriptStatus?: string; // Status do script: Implementado, Caiu, Pendente de instalar

    @ContractField({
        protoType: 'double',
        nullable: true,
        index: true,
    })
    weighting?: number; // Ponderação (porcentagem, até 2 casas decimais)

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    link?: string; // Link (até 500 caracteres)

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    linkStatus?: string; // Status do link: 'OK' ou 'Quebrado'

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean; // Status ativo/inativo
}

