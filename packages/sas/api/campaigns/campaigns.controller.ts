import {
    Controller, Get, Param, Post, Put, Delete, Queries, Body
} from "@cmmv/http";

import {
    CampaignsService
} from "./campaigns.service";

import {
    Repository
} from "@cmmv/repository";

@Controller("affiliation-manager/campaigns")
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService){}

    /**
     * Listar todas as campanhas com filtros opcionais
     */
    @Get("")
    async getAll(@Queries() queries: any) {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        return await Repository.findAll(CampaignsEntity, queries || {}, []);
    }

    /**
     * Buscar todas as campanhas (endpoint customizado)
     */
    @Get("all")
    async getAllCampaigns() {
        return await this.campaignsService.getAllCampaigns();
    }

    /**
     * Buscar campanhas ativas de um parceiro
     */
    @Get("partner/:partnerId/active")
    async getActiveCampaignsByPartner(@Param("partnerId") partnerId: string) {
        return await this.campaignsService.getActiveCampaignsByPartner(partnerId);
    }

    /**
     * Buscar todas as campanhas de um parceiro
     */
    @Get("partner/:partnerId/all")
    async getAllCampaignsByPartner(@Param("partnerId") partnerId: string) {
        return await this.campaignsService.getAllCampaignsByPartner(partnerId);
    }

    /**
     * Validar links de todas as campanhas (rota específica - deve vir antes da genérica)
     */
    @Post("validate-links")
    async validateAllActiveCampaignsLinks() {
        return await this.campaignsService.validateActiveCampaignsLinks();
    }

    /**
     * Validar link de uma campanha específica (rota com parâmetro - deve vir antes da genérica)
     */
    @Post(":campaignId/validate-link")
    async validateCampaignLink(@Param("campaignId") campaignId: string) {
        return await this.campaignsService.validateCampaignLink(campaignId);
    }

    /**
     * Criar nova campanha (rota genérica - deve vir depois das específicas)
     */
    @Post("")
    async create(@Body() body: any) {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        console.log('[CampaignsController.create] Dados recebidos:', JSON.stringify(body, null, 2));
        console.log('[CampaignsController.create] neverStarted recebido:', body.neverStarted, 'tipo:', typeof body.neverStarted);
        const result = await Repository.insert(CampaignsEntity, body);
        console.log('[CampaignsController.create] Resultado da inserção:', JSON.stringify(result, null, 2));
        return result;
    }

    /**
     * Buscar campanha por ID (deve vir depois das rotas específicas)
     */
    @Get(":id")
    async getById(@Param("id") id: string) {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        return await Repository.findOne(CampaignsEntity, { id });
    }

    /**
     * Atualizar campanha
     */
    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        console.log('[CampaignsController.update] ID:', id);
        console.log('[CampaignsController.update] Dados recebidos:', JSON.stringify(body, null, 2));
        console.log('[CampaignsController.update] neverStarted recebido:', body.neverStarted, 'tipo:', typeof body.neverStarted);
        const result = await Repository.update(CampaignsEntity, { id }, body);
        console.log('[CampaignsController.update] Resultado da atualização:', JSON.stringify(result, null, 2));
        return result;
    }

    /**
     * Excluir campanha
     */
    @Delete(":id")
    async delete(@Param("id") id: string) {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        return await Repository.delete(CampaignsEntity, { id });
    }
}




