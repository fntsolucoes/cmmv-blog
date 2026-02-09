import "reflect-metadata";
import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasCostCenters',
    controllerCustomPath: 'affiliation-manager/cost-centers',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
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

    /** JSON com dados tributarios quando identificador e CNPJ: taxRegime, accrualRegime, cnaePrincipal, municipality, state, regimeStartDate, simplesAnexo, issPercentage, meiOptant */
    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    cnpjDetails?: string;

    @ContractField({ protoType: 'string', nullable: true, index: true })
    tax_regime_id?: string;

    @ContractField({ protoType: 'boolean', nullable: false, defaultValue: false, index: true })
    is_mei_optant!: boolean;

    /** JSON: personType (PF|PJ|EXTERIOR), issRetentionIndicator, presumptionRate (PJ Lucro Presumido %), inssRate, irrfProgressiveTable (PF), exteriorInvoice, exteriorIof (Exterior) */
    @ContractField({ protoType: 'text', nullable: true })
    fiscal_profile?: string;
}

