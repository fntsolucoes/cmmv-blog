import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasCommercialPartners',
    controllerCustomPath: 'sas/commercial-partners',
    protoPackage: 'sas',
    subPath: '/sas',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_commercial_partners",
        databaseTimestamps: true
    }
})
export class SasCommercialPartnersContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string; // Nome do Parceiro Comercial

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    partnerType!: string; // Rede de Afiliação, Direto

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    costCenterId!: string; // ID do Centro de Custos (Empresa de Recebimento)

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    defaultCurrency!: string; // USD, EUR, BRL, Outra

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;
}

