import { Controller, Get, Post, Put, Delete, Queries, Body, Param } from "@cmmv/http";
import { Repository } from "@cmmv/repository";

@Controller("affiliation-manager/cost-center-tax-rules/v2")
export class CostCenterTaxRulesController {
    @Get("")
    async getAll(@Queries() queries: any) {
        const Entity = Repository.getEntity("SasCostCenterTaxRulesEntity");
        return await Repository.findAll(Entity, queries || {}, []);
    }

    @Get(":id")
    async getById(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasCostCenterTaxRulesEntity");
        return await Repository.findOne(Entity, { id });
    }

    @Post("")
    async create(@Body() body: any) {
        const Entity = Repository.getEntity("SasCostCenterTaxRulesEntity");
        return await Repository.insert(Entity, body);
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        const Entity = Repository.getEntity("SasCostCenterTaxRulesEntity");
        return await Repository.update(Entity, { id }, body);
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasCostCenterTaxRulesEntity");
        return await Repository.delete(Entity, { id });
    }

    /**
     * Inicializa as regras de um centro de custo copiando das regras globais.
     * POST /affiliation-manager/cost-center-tax-rules/v2/init/:costCenterId
     */
    @Post("init/:costCenterId")
    async initForCostCenter(@Param("costCenterId") costCenterId: string) {
        const Entity = Repository.getEntity("SasCostCenterTaxRulesEntity");
        const GlobalEntity = Repository.getEntity("SasTaxRulesEntity");

        // Verificar se ja tem regras
        const existing = await Repository.findAll(Entity, { cost_center_id: costCenterId }, []);
        const existingItems = Array.isArray(existing?.data) ? existing.data
            : Array.isArray(existing?.items) ? existing.items
            : Array.isArray(existing) ? existing : [];

        if (existingItems.length > 0) {
            return { data: existingItems, message: "Regras ja existem para este centro de custo" };
        }

        // Copiar regras globais
        const globalRes = await Repository.findAll(GlobalEntity, {}, []);
        const globalItems = Array.isArray(globalRes?.data) ? globalRes.data
            : Array.isArray(globalRes?.items) ? globalRes.items
            : Array.isArray(globalRes) ? globalRes : [];

        const created: any[] = [];
        for (const g of globalItems) {
            const newRule = await Repository.insert(Entity, {
                cost_center_id: costCenterId,
                tax_name: g.tax_name,
                percentage: g.percentage,
                min_threshold: g.min_threshold,
                active: g.active
            });
            created.push(newRule);
        }

        return { data: created, message: "Regras inicializadas a partir das regras globais" };
    }
}
