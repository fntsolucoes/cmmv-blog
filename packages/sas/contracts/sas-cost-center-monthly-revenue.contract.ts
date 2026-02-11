import "reflect-metadata";
import { Contract, AbstractContract, ContractField } from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasCostCenterMonthlyRevenue',
    controllerCustomPath: 'affiliation-manager/cost-center-monthly-revenue',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: false,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_cost_center_monthly_revenue",
        databaseTimestamps: true
    }
})
export class SasCostCenterMonthlyRevenueContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true })
    cost_center_id!: string;

    @ContractField({ protoType: 'int', nullable: false })
    year!: number;

    @ContractField({ protoType: 'int', nullable: false })
    month!: number;

    @ContractField({ protoType: 'double', nullable: false, defaultValue: 0 })
    gross_revenue!: number;
}
