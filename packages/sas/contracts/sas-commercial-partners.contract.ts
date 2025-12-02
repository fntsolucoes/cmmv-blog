import "reflect-metadata";
import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasCommercialPartners',
    controllerCustomPath: 'affiliation-manager/commercial-partners',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
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
        nullable: true,
        index: false,
    })
    affiliateNetworkId?: string; // ID da Rede de Afiliação (deprecated - não utilizado mais)

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

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    script?: string; // Código do script (para parceiros diretos)

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
        protoType: 'date',
        nullable: true,
        index: true,
    })
    startDate?: Date; // Data de Início (para parceiros diretos)

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    endDate?: Date; // Data de Fim (para parceiros diretos)

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    notes?: string; // Anotações (login, senha, link do dashboard, etc.)
}

