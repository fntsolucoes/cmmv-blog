import "reflect-metadata";
import { Contract, AbstractContract, ContractField } from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTaxRules',
    controllerCustomPath: 'affiliation-manager/tax-rules',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_tax_rules",
        databaseTimestamps: true
    }
})
export class SasTaxRulesContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true })
    tax_name!: string;

    @ContractField({ protoType: 'double', nullable: false })
    percentage!: number;

    @ContractField({ protoType: 'double', nullable: true })
    min_threshold?: number;

    @ContractField({ protoType: 'boolean', nullable: false, defaultValue: true, index: true })
    active!: boolean;
}
