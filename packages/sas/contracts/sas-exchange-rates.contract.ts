import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasExchangeRates',
    controllerCustomPath: 'sas/exchange-rates',
    protoPackage: 'sas',
    subPath: '/sas',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_exchange_rates",
        databaseTimestamps: true
    }
})
export class SasExchangeRatesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        unique: true
    })
    currencyPair!: string; // EUR-BRL, USD-BRL

    @ContractField({
        protoType: 'date',
        nullable: false,
        index: true,
        unique: true
    })
    date!: Date; // Data da taxa

    @ContractField({
        protoType: 'double',
        nullable: false,
        index: true,
    })
    rate!: number; // Taxa de fechamento ("Último")

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    source?: string; // Fonte da taxa (investing.com)
}

