import "reflect-metadata";
import { Contract, AbstractContract, ContractField } from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasSimplesNacionalAnnexBrackets',
    controllerCustomPath: 'affiliation-manager/simples-nacional-annex-brackets',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: false,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_simples_nacional_annex_brackets",
        databaseTimestamps: true
    }
})
export class SasSimplesNacionalAnnexBracketsContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true })
    annex_code!: string;

    @ContractField({ protoType: 'string', nullable: true })
    annex_name?: string;

    @ContractField({ protoType: 'int', nullable: false })
    faixa!: number;

    @ContractField({ protoType: 'double', nullable: false })
    rbt12_limit!: number;

    @ContractField({ protoType: 'double', nullable: false })
    nominal_rate_percent!: number;

    @ContractField({ protoType: 'double', nullable: false, defaultValue: 0 })
    parcel_to_deduct!: number;
}
