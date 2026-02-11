import "reflect-metadata";
import { Contract, AbstractContract, ContractField } from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasCostCenterMonthlyFatorR',
    controllerCustomPath: 'affiliation-manager/cost-center-monthly-fator-r',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: false,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_cost_center_monthly_fator_r",
        databaseTimestamps: true
    }
})
export class SasCostCenterMonthlyFatorRContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true })
    cost_center_id!: string;

    @ContractField({ protoType: 'int', nullable: false })
    year!: number;

    @ContractField({ protoType: 'int', nullable: false })
    month!: number;

    /** Fator R = folha de pagamento / receita bruta (ex: 0.28 = 28%) */
    @ContractField({ protoType: 'double', nullable: false, defaultValue: 0 })
    fator_r!: number;
}
