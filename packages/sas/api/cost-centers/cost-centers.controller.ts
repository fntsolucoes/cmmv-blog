import {
    Controller, Get, Post, Put, Delete, Queries, Body, Param
} from "@cmmv/http";

import {
    CostCentersService
} from "./cost-centers.service";

import {
    Repository
} from "@cmmv/repository";

@Controller("affiliation-manager/cost-centers")
export class CostCentersController {
    constructor(private readonly costCentersService: CostCentersService){}

    /**
     * Listar todos os centros de custos
     */
    @Get("")
    async getAll(@Queries() queries: any) {
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");
        return await Repository.findAll(CostCentersEntity, queries || {}, []);
    }

    /**
     * Buscar centro de custo por ID
     */
    @Get(":id")
    async getById(@Param("id") id: string) {
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");
        return await Repository.findOne(CostCentersEntity, { id });
    }

    /**
     * Criar novo centro de custo
     */
    @Post("")
    async create(@Body() body: any) {
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");
        return await Repository.insert(CostCentersEntity, body);
    }

    /**
     * Atualizar centro de custo
     */
    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");
        return await Repository.update(CostCentersEntity, { id }, body);
    }

    /**
     * Excluir centro de custo
     */
    @Delete(":id")
    async delete(@Param("id") id: string) {
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");
        return await Repository.delete(CostCentersEntity, { id });
    }
}











