import {
    Controller, Get, Post, Put, Delete, Queries, Body, Param
} from "@cmmv/http";

import {
    ShareholdersService
} from "./shareholders.service";

import {
    Repository
} from "@cmmv/repository";

@Controller("affiliation-manager/shareholders")
export class ShareholdersController {
    constructor(private readonly shareholdersService: ShareholdersService){}

    /**
     * Listar todos os sócios
     */
    @Get("")
    async getAll(@Queries() queries: any) {
        const ShareholdersEntity = Repository.getEntity("SasShareholdersEntity");
        return await Repository.findAll(ShareholdersEntity, queries || {}, []);
    }

    /**
     * Buscar sócio por ID
     */
    @Get(":id")
    async getById(@Param("id") id: string) {
        const ShareholdersEntity = Repository.getEntity("SasShareholdersEntity");
        return await Repository.findOne(ShareholdersEntity, { id }, []);
    }

    /**
     * Criar novo sócio
     */
    @Post("")
    async create(@Body() body: any) {
        const ShareholdersEntity = Repository.getEntity("SasShareholdersEntity");
        return await Repository.insert(ShareholdersEntity, body);
    }

    /**
     * Atualizar sócio
     */
    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        const ShareholdersEntity = Repository.getEntity("SasShareholdersEntity");
        return await Repository.update(ShareholdersEntity, id, body);
    }

    /**
     * Excluir sócio
     */
    @Delete(":id")
    async delete(@Param("id") id: string) {
        const ShareholdersEntity = Repository.getEntity("SasShareholdersEntity");
        return await Repository.delete(ShareholdersEntity, id);
    }

    /**
     * Validar porcentagens
     */
    @Get("validate-percentages")
    async validatePercentages() {
        return await this.shareholdersService.validatePercentages();
    }
}



