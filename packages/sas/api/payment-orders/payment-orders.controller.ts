import {
    Controller, Get, Post, Put, Delete, Patch,
    Queries, Body, Param
} from "@cmmv/http";
import { Auth } from "@cmmv/auth";
import {
    PaymentOrdersService
} from "./payment-orders.service";

@Controller("affiliation-manager/payment-orders/v2")
export class PaymentOrdersBusinessController {
    constructor(private readonly paymentOrdersService: PaymentOrdersService){}

    /**
     * Listar ordens de pagamento com filtros simples
     */
    @Get("")
    async getAll(@Queries() queries: any) {
        return await this.paymentOrdersService.findAll(queries || {});
    }

    /**
     * Exportar todas as ordens em formato do banco (para CSV)
     */
    @Get("export")
    async exportAll() {
        return await this.paymentOrdersService.findAllForExport();
    }

    /**
     * Importar ordens de pagamento em lote via CSV
     */
    @Post("import-csv")
    async importCSV(@Body() body: { csvContent: string }) {
        return await this.paymentOrdersService.importFromCSV(body.csvContent || "");
    }

    /**
     * Verificar se o usuario atual pode fazer update em lote (somente root).
     * Usado na UI para exibir o botao "Update em lote" apenas para root.
     */
    @Get("can-bulk-update")
    @Auth({ rootOnly: true })
    async canBulkUpdate() {
        return { canBulkUpdate: true };
    }

    /**
     * Atualizar ordens em lote via CSV no mesmo formato do export (formato do banco).
     * Somente usuario root pode executar.
     */
    @Post("update-csv")
    @Auth({ rootOnly: true })
    async updateCSV(@Body() body: { csvContent: string }) {
        return await this.paymentOrdersService.updateFromExportCSV(body.csvContent || "");
    }

    /**
     * Recalcular impostos de todas as ordens em aberto com motor tributario.
     * Somente usuario root pode executar.
     */
    @Post("recalculate-taxes")
    @Auth({ rootOnly: true })
    async recalculateTaxes() {
        return await this.paymentOrdersService.recalculateAllTaxes();
    }

    /**
     * Buscar ordem por ID
     */
    @Get(":id")
    async getById(@Param("id") id: string) {
        return await this.paymentOrdersService.findById(id);
    }

    /**
     * Criar nova ordem de pagamento
     */
    @Post("")
    async create(@Body() body: any) {
        return await this.paymentOrdersService.create(body);
    }

    /**
     * Atualizar ordem de pagamento
     */
    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        return await this.paymentOrdersService.update(id, body);
    }

    /**
     * Atualizar status da ordem (equivalente ao PATCH /payment-orders/:id/status do 1001div)
     */
    @Patch(":id/status")
    async updateStatus(
        @Param("id") id: string,
        @Body() body: {
            status: string;
            effectivePaymentDate?: string | Date | null;
            paidValue?: number | null;
            invoiceAttachment?: string | null;
        }
    ) {
        return await this.paymentOrdersService.updateStatus(
            id,
            body.status,
            body.effectivePaymentDate,
            body.paidValue,
            body.invoiceAttachment
        );
    }

    /**
     * Excluir ordem de pagamento
     */
    @Delete(":id")
    async delete(@Param("id") id: string) {
        return await this.paymentOrdersService.delete(id);
    }

    /**
     * Calcular valor líquido para uma ordem específica
     */
    @Get(":id/net-amount")
    async getNetAmount(@Param("id") id: string) {
        return await this.paymentOrdersService.calculateNetAmount(id);
    }
}


