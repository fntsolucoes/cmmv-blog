import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasCostCenters',
    controllerCustomPath: 'sas/cost-centers',
    protoPackage: 'sas',
    subPath: '/sas',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_cost_centers",
        databaseTimestamps: true
    }
})
export class SasCostCentersContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        unique: true
    })
    identifier!: string; // CNPJ ou CPF

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string; // Nome da Empresa/Pessoa

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    paymentMethods?: string; // JSON array de métodos: [{"method": "Wise", "details": "email@exemplo.com"}, ...]

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;
}

