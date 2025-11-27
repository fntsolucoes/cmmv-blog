import {
    Controller, Get, Post, Param, Body, Put, Delete
} from "@cmmv/http";

import {
    Repository
} from "@cmmv/repository";

import {
    SasTagsCustomService
} from "./tags.service";

@Controller("affiliation-manager/tags")
export class SasTagsCustomController {
    constructor(private readonly tagsService: SasTagsCustomService) {}

    /**
     * Listar todas as tags
     */
    @Get("all")
    async getAllTags() {
        return await this.tagsService.getAllTags();
    }

    /**
     * Criar nova tag
     */
    @Post()
    async create(@Body() body: any) {
        return await this.tagsService.createTagAndAttachToCampaign(body);
    }

    /**
     * Atualizar tag
     */
    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        const TagsEntity = Repository.getEntity("SasTagsEntity");
        return await Repository.update(TagsEntity, id, body);
    }

    /**
     * Excluir tag
     */
    @Delete(":id")
    async delete(@Param("id") id: string) {
        const TagsEntity = Repository.getEntity("SasTagsEntity");
        return await Repository.delete(TagsEntity, id);
    }

    /**
     * Gerar script para um modelo de script
     */
    @Post("generate-script/:scriptSettingId")
    async generateScript(@Param("scriptSettingId") scriptSettingId: string) {
        const result = await this.tagsService.generateScript(scriptSettingId);
        return result;
    }
}

