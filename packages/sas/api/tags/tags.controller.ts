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
        // Log dos dados recebidos no controller
        console.log('[TagsController.create] Dados recebidos:', {
            description: body.description,
            scriptSettingId: body.scriptSettingId,
            campaignIds: body.campaignIds,
            generatedScript: body.generatedScript ? `${body.generatedScript.substring(0, 100)}...` : null,
            generatedCode: body.generatedCode,
            active: body.active,
            scriptStatus: body.scriptStatus
        });
        
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
        try {
            const TagsEntity = Repository.getEntity("SasTagsEntity");
            
            console.log(`[TagsController.delete] Tentando deletar tag com ID: ${id}`);
            
            // Deletar a tag usando objeto { id } (padrão mais comum)
            const result = await Repository.delete(TagsEntity, { id });
            
            console.log(`[TagsController.delete] Tag ${id} deletada. Resultado:`, result);
            
            return result || { success: true, message: 'Tag deletada com sucesso' };
        } catch (error: any) {
            console.error(`[TagsController.delete] Erro ao deletar tag ${id}:`, error);
            console.error(`[TagsController.delete] Tipo do erro: ${error?.constructor?.name || 'Unknown'}`);
            console.error(`[TagsController.delete] Mensagem: ${error?.message || 'Sem mensagem'}`);
            console.error(`[TagsController.delete] Código: ${error?.code || 'Sem código'}`);
            if (error?.stack) {
                console.error(`[TagsController.delete] Stack trace:`, error.stack);
            }
            throw error;
        }
    }

    /**
     * Gerar script para um modelo de script
     */
    @Post("generate-script/:scriptSettingId")
    async generateScript(@Param("scriptSettingId") scriptSettingId: string) {
        const result = await this.tagsService.generateScript(scriptSettingId);
        return result;
    }

    /**
     * Validar scripts de todas as tags (verifica se o script está presente na página da campanha)
     */
    @Post("validate-scripts")
    async validateScripts() {
        return await this.tagsService.validateAllTagsScripts();
    }
}

