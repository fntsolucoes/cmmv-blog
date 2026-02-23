import { Controller, Post, Body } from "@cmmv/http";
import { TaxCalcService, TaxCalcInput } from "./tax-calc.service";

@Controller("affiliation-manager/tax-calc")
export class TaxCalcController {
    constructor(private readonly taxCalcService: TaxCalcService) {}

    @Post("")
    async calculate(@Body() body: TaxCalcInput) {
        return await this.taxCalcService.calculate({
            costCenterId: body.costCenterId || "",
            grossAmount: Number(body.grossAmount) || 0,
            referenceMonth: body.referenceMonth,
            orderId: body.orderId,
            invoiceCnae: body.invoiceCnae ?? undefined,
            mesReferenciaNota: body.mesReferenciaNota ?? undefined
        });
    }
}
