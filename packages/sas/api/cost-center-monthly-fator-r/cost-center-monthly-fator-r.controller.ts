import { Controller, Get, Post, Put, Delete, Queries, Body, Param } from "@cmmv/http";
import { Repository } from "@cmmv/repository";

@Controller("affiliation-manager/cost-center-monthly-fator-r")
export class CostCenterMonthlyFatorRController {
    @Get("")
    async getAll(@Queries() queries: any) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyFatorREntity");
        return await Repository.findAll(Entity, queries || {}, []);
    }

    @Get(":id")
    async getById(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyFatorREntity");
        return await Repository.findOne(Entity, { id });
    }

    @Post("")
    async create(@Body() body: any) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyFatorREntity");
        return await Repository.insert(Entity, body);
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyFatorREntity");
        const payload: Record<string, unknown> = {};
        if (body.fator_r !== undefined) {
            payload.fator_r = Math.min(1, Math.max(0, Number(body.fator_r) || 0));
        }
        if (Object.keys(payload).length === 0) {
            return await Repository.findOne(Entity, { id });
        }
        await Repository.update(Entity, { id }, payload);
        return await Repository.findOne(Entity, { id });
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyFatorREntity");
        return await Repository.delete(Entity, { id });
    }

    /**
     * Upsert: define Fator R de um mes (folha/receita; ex: 0.28 = 28%).
     * POST .../by-month  Body: { cost_center_id, year, month, fator_r }
     */
    @Post("by-month")
    async upsert(@Body() body: { cost_center_id: string; year: number; month: number; fator_r: number }) {
        const Entity = Repository.getEntity("SasCostCenterMonthlyFatorREntity");
        const existing = await Repository.findOne(Entity, {
            cost_center_id: body.cost_center_id,
            year: body.year,
            month: body.month
        });
        const payload = {
            cost_center_id: body.cost_center_id,
            year: body.year,
            month: body.month,
            fator_r: Math.min(1, Math.max(0, Number(body.fator_r) || 0))
        };
        if (existing?.id) {
            await Repository.update(Entity, { id: existing.id }, payload);
            return await Repository.findOne(Entity, { id: existing.id });
        }
        return await Repository.insert(Entity, payload);
    }
}
