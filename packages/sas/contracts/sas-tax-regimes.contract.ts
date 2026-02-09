import "reflect-metadata";
import { Contract, AbstractContract, ContractField } from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTaxRegimes',
    controllerCustomPath: 'affiliation-manager/tax-regimes',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_tax_regimes",
        databaseTimestamps: true
    }
})
export class SasTaxRegimesContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true, unique: true })
    code!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    name!: string;
}
