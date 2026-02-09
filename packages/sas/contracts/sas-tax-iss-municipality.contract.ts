import "reflect-metadata";
import { Contract, AbstractContract, ContractField } from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTaxIssMunicipality',
    controllerCustomPath: 'affiliation-manager/tax-iss-municipality',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_tax_iss_municipality",
        databaseTimestamps: true
    }
})
export class SasTaxIssMunicipalityContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true })
    municipality!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    uf!: string;

    @ContractField({ protoType: 'double', nullable: false })
    percent!: number;
}
