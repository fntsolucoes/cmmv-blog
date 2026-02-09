import { Controller, Get, Post, Put, Delete, Queries, Body, Param } from "@cmmv/http";
import { Repository } from "@cmmv/repository";

@Controller("affiliation-manager/tax-regimes/v2")
export class TaxRegimesController {
    @Get("")
    async getAll(@Queries() queries: any) {
        const Entity = Repository.getEntity("SasTaxRegimesEntity");
        return await Repository.findAll(Entity, queries || {}, []);
    }

    @Get(":id")
    async getById(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasTaxRegimesEntity");
        return await Repository.findOne(Entity, { id });
    }

    @Post("")
    async create(@Body() body: any) {
        const Entity = Repository.getEntity("SasTaxRegimesEntity");
        return await Repository.insert(Entity, body);
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        const Entity = Repository.getEntity("SasTaxRegimesEntity");
        return await Repository.update(Entity, { id }, body);
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasTaxRegimesEntity");
        return await Repository.delete(Entity, { id });
    }
}
