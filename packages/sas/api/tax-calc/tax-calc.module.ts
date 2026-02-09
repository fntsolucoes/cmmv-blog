import { Module } from "@cmmv/core";
import { TaxCalcService } from "./tax-calc.service";
import { TaxCalcController } from "./tax-calc.controller";

export const SasTaxCalcModule = new Module("sas-tax-calc", {
    providers: [TaxCalcService],
    controllers: [TaxCalcController]
});
