import { Controller, Get, Post, Put, Delete, Queries, Body, Param } from "@cmmv/http";
import { Repository } from "@cmmv/repository";

@Controller("affiliation-manager/cost-center-monthly-revenue")
export class CostCenterMonthlyRevenueController {
    @Get("")
    async getAll(@Queries() queries: any) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyRevenueEntity");
        return await Repository.findAll(Entity, queries || {}, []);
    }

    @Get(":id")
    async getById(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyRevenueEntity");
        return await Repository.findOne(Entity, { id });
    }

    @Post("")
    async create(@Body() body: any) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyRevenueEntity");
        return await Repository.insert(Entity, body);
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyRevenueEntity");
        const payload: Record<string, unknown> = {};
        if (body.gross_revenue !== undefined) payload.gross_revenue = Number(body.gross_revenue) || 0;
        if (Object.keys(payload).length === 0) {
            return await Repository.findOne(Entity, { id });
        }
        await Repository.update(Entity, { id }, payload);
        return await Repository.findOne(Entity, { id });
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyRevenueEntity");
        return await Repository.delete(Entity, { id });
    }

    /**
     * Upsert: define faturamento bruto de um mes. Se ja existir (cost_center_id, year, month), atualiza.
     * POST .../by-month  Body: { cost_center_id, year, month, gross_revenue }
     */
    @Post("by-month")
    async upsert(@Body() body: { cost_center_id: string; year: number; month: number; gross_revenue: number }) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyRevenueEntity");
        const existing = await Repository.findOne(Entity, {
            cost_center_id: body.cost_center_id,
            year: body.year,
            month: body.month
        });
        const payload = {
            cost_center_id: body.cost_center_id,
            year: body.year,
            month: body.month,
            gross_revenue: Number(body.gross_revenue) || 0
        };
        if (existing?.id) {
            await Repository.update(Entity, { id: existing.id }, payload);
            return await Repository.findOne(Entity, { id: existing.id });
        }
        return await Repository.insert(Entity, payload);
    }
}
