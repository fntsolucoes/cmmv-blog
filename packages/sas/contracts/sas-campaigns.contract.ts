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
    name!: string; // Nome da Campanha

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    startMonth!: string; // Mês/Ano de Início (formato: YYYY-MM)

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    endMonth?: string; // Mês/Ano de Fim (formato: YYYY-MM) - opcional

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean; // Se está "Rodando"
}

