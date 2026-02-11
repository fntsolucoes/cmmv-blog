import "reflect-metadata";
import { Contract, AbstractContract, ContractField } from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasSimplesNacionalCnae',
    controllerCustomPath: 'affiliation-manager/simples-nacional-cnae',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: false,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_simples_nacional_cnae",
        databaseTimestamps: true
    }
})
export class SasSimplesNacionalCnaeContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false })
    code!: string;

    @ContractField({ protoType: 'string', nullable: false })
    denominacao!: string;

    @ContractField({ protoType: 'string', nullable: true })
    annex_code?: string;

    @ContractField({ protoType: 'boolean', nullable: false, defaultValue: false })
    fator_r!: boolean;
}
