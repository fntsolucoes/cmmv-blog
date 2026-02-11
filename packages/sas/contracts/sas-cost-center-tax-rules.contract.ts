import "reflect-metadata";
import { Contract, AbstractContract, ContractField } from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasCostCenterTaxRules',
    controllerCustomPath: 'affiliation-manager/cost-center-tax-rules',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_cost_center_tax_rules",
        databaseTimestamps: true
    }
})
export class SasCostCenterTaxRulesContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true })
    cost_center_id!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    tax_name!: string;

    @ContractField({ protoType: 'double', nullable: false })
    percentage!: number;

    @ContractField({ protoType: 'double', nullable: true })
    min_threshold?: number;

    @ContractField({ protoType: 'boolean', nullable: false, defaultValue: true, index: true })
    active!: boolean;
}
