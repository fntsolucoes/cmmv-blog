import {
    Service, Logger, Cron
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import {
    LinkValidatorService
} from "./link-validator.service";

@Service()
export class CampaignsService {
    private readonly logger = new Logger("CampaignsService");

    constructor(private readonly linkValidatorService: LinkValidatorService) {}
    /**
     * Buscar campanhas ativas de um parceiro
     */
    async getActiveCampaignsByPartner(partnerId: string) {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        const result = await Repository.findAll(CampaignsEntity, {
            where: { 
                commercialPartnerId: partnerId,
                active: true
            },
            limit: 1000
        });
        
        // Se neverStarted não estiver presente, buscar via query raw e mesclar
        if (result?.data && result.data.length > 0 && !('neverStarted' in result.data[0])) {
            const queryRunner = Repository.getDataSource().createQueryRunner();
            try {
                const rawData = await queryRunner.query(`
                    SELECT id, neverStarted 
                    FROM sas_campaigns
                    WHERE commercialPartnerId = ? AND active = 1
                `, [partnerId]);
                const neverStartedMap = new Map(rawData.map((r: any) => [r.id, r.neverStarted]));
                result.data = result.data.map((campaign: any) => ({
                    ...campaign,
                    neverStarted: neverStartedMap.get(campaign.id) ?? 0
                }));
            } finally {
                await queryRunner.release();
            }
        }
        
        return result;
    }

    /**
     * Buscar todas as campanhas de um parceiro (ativas e inativas)
     * Sem limite para garantir que todas sejam retornadas
     */
    async getAllCampaignsByPartner(partnerId: string) {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        
        console.log(`[getAllCampaignsByPartner] Buscando campanhas para parceiro ${partnerId}`);
        
        // Primeiro, contar quantas campanhas existem
        const totalCount = await Repository.count(CampaignsEntity, {
            commercialPartnerId: partnerId
        });
        
        console.log(`[getAllCampaignsByPartner] Total de campanhas no banco: ${totalCount}`);
        
        // Buscar todas as campanhas usando limite alto
        const result = await Repository.findAll(CampaignsEntity, {
            commercialPartnerId: partnerId,
            limit: 10000  // Limite alto para pegar todas as campanhas
        }, [], {
            order: {
                startDate: 'DESC'
            }
        });
        
        // Se neverStarted não estiver presente, buscar via query raw e mesclar
        if (result?.data && result.data.length > 0 && !('neverStarted' in result.data[0])) {
            console.log(`[getAllCampaignsByPartner] ⚠️ Campo neverStarted não presente, buscando via query raw...`);
            const queryRunner = Repository.getDataSource().createQueryRunner();
            try {
                const rawData = await queryRunner.query(`
                    SELECT id, neverStarted 
                    FROM sas_campaigns
                    WHERE commercialPartnerId = ?
                `, [partnerId]);
                const neverStartedMap = new Map(rawData.map((r: any) => [r.id, r.neverStarted]));
                result.data = result.data.map((campaign: any) => ({
                    ...campaign,
                    neverStarted: neverStartedMap.get(campaign.id) ?? 0
                }));
                console.log(`[getAllCampaignsByPartner] ✅ Campo neverStarted adicionado via query raw`);
            } finally {
                await queryRunner.release();
            }
        }
        
        const returnedCount = result?.data?.length || 0;
        console.log(`[getAllCampaignsByPartner] Campanhas retornadas: ${returnedCount} de ${totalCount} esperadas`);
        
        // Se retornou menos que o total e exatamente 10, pode haver limite padrão
        if (returnedCount < totalCount && returnedCount === 10) {
            console.log(`[getAllCampaignsByPartner] ⚠️ Limite padrão detectado! Buscando todas as campanhas sem ordenação...`);
            
            // Tentar buscar sem ordenação (pode retornar mais registros)
            const resultUnordered = await Repository.findAll(CampaignsEntity, {
                commercialPartnerId: partnerId,
                limit: 10000
            }, []);
            
            const unorderedCount = resultUnordered?.data?.length || 0;
            console.log(`[getAllCampaignsByPartner] Campanhas retornadas sem ordenação: ${unorderedCount}`);
            
            if (unorderedCount >= totalCount) {
                // Ordenar manualmente
                const sortedData = (resultUnordered?.data || []).sort((a: any, b: any) => {
                    const dateA = new Date(a.startDate).getTime();
                    const dateB = new Date(b.startDate).getTime();
                    return dateB - dateA; // DESC
                });
                
                console.log(`[getAllCampaignsByPartner] ✅ Retornando ${sortedData.length} campanhas ordenadas manualmente`);
                return {
                    ...resultUnordered,
                    data: sortedData
                };
            }
        }
        
        console.log(`[getAllCampaignsByPartner] ✅ Retornando ${returnedCount} campanhas`);
        return result;
    }

    /**
     * Buscar todas as campanhas sem limite
     * Garante que todos os registros sejam retornados
     */
    async getAllCampaigns() {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        
        console.log(`[getAllCampaigns] Buscando todas as campanhas...`);
        
        // Primeiro, contar quantas campanhas existem
        const totalCount = await Repository.count(CampaignsEntity, {});
        
        console.log(`[getAllCampaigns] Total de campanhas no banco: ${totalCount}`);
        
        // Buscar todas as campanhas usando limite alto
        const result = await Repository.findAll(CampaignsEntity, {
            limit: 10000  // Limite alto para pegar todas as campanhas
        }, [], {
            order: {
                startDate: 'DESC'
            }
        });
        
        // Se neverStarted não estiver presente, buscar via query raw e mesclar
        if (result?.data && result.data.length > 0 && !('neverStarted' in result.data[0])) {
            console.log(`[getAllCampaigns] ⚠️ Campo neverStarted não presente, buscando via query raw...`);
            const queryRunner = Repository.getDataSource().createQueryRunner();
            try {
                const rawData = await queryRunner.query(`
                    SELECT id, neverStarted 
                    FROM sas_campaigns
                `);
                const neverStartedMap = new Map(rawData.map((r: any) => [r.id, r.neverStarted]));
                result.data = result.data.map((campaign: any) => ({
                    ...campaign,
                    neverStarted: neverStartedMap.get(campaign.id) ?? 0
                }));
                console.log(`[getAllCampaigns] ✅ Campo neverStarted adicionado via query raw`);
            } finally {
                await queryRunner.release();
            }
        }
        
        const returnedCount = result?.data?.length || 0;
        console.log(`[getAllCampaigns] Campanhas retornadas: ${returnedCount} de ${totalCount} esperadas`);
        
        // Verificar se neverStarted está presente na resposta
        if (result?.data && result.data.length > 0) {
            const firstCampaign = result.data[0];
            const hasNeverStarted = 'neverStarted' in firstCampaign;
            const neverStartedValue = firstCampaign.neverStarted;
            const neverStartedType = typeof neverStartedValue;
            
            console.log(`[getAllCampaigns] ✅ Verificação neverStarted na primeira campanha:`);
            console.log(`  - Campo presente: ${hasNeverStarted}`);
            console.log(`  - Valor: ${neverStartedValue}`);
            console.log(`  - Tipo: ${neverStartedType}`);
            
            // Contar campanhas com neverStarted = 1
            const neverStartedCount = result.data.filter((c: any) => 
                c.neverStarted === true || c.neverStarted === 1 || c.neverStarted === '1'
            ).length;
            console.log(`[getAllCampaigns] Campanhas com neverStarted = true/1: ${neverStartedCount}`);
        }
        
        // Se retornou menos que o total e exatamente 10, pode haver limite padrão
        if (returnedCount < totalCount && returnedCount === 10) {
            console.log(`[getAllCampaigns] ⚠️ Limite padrão detectado! Buscando todas as campanhas sem ordenação...`);
            
            // Tentar buscar sem ordenação (pode retornar mais registros)
            const resultUnordered = await Repository.findAll(CampaignsEntity, {
                limit: 10000
            }, []);
            
            const unorderedCount = resultUnordered?.data?.length || 0;
            console.log(`[getAllCampaigns] Campanhas retornadas sem ordenação: ${unorderedCount}`);
            
            if (unorderedCount >= totalCount) {
                // Ordenar manualmente
                const sortedData = (resultUnordered?.data || []).sort((a: any, b: any) => {
                    const dateA = new Date(a.startDate).getTime();
                    const dateB = new Date(b.startDate).getTime();
                    return dateB - dateA; // DESC
                });
                
                console.log(`[getAllCampaigns] ✅ Retornando ${sortedData.length} campanhas ordenadas manualmente`);
                return {
                    ...resultUnordered,
                    data: sortedData
                };
            }
        }
        
        console.log(`[getAllCampaigns] ✅ Retornando ${returnedCount} campanhas`);
        return result;
    }

    /**
     * Valida links de todas as campanhas (ativas e inativas) que possuem links
     * Roda automaticamente a cada 2 horas via cron job
     */
    @Cron('0 */2 * * *') // A cada 2 horas
    async validateActiveCampaignsLinks() {
        // Verificar se o contexto this está disponível
        if (!this || !this.logger) {
            console.error('[CampaignsService] Contexto this/logger indisponível no cron job de validação de links');
            return;
        }

        try {
            return await this.validateActiveCampaignsLinksInternal();
        } catch (error: any) {
            // Fallback: usar console.error se logger não estiver disponível
            if (this && this.logger) {
                this.logger.error('[CampaignsService] Erro no cron job de validação de links:', error);
            } else {
                console.error('[CampaignsService] Erro no cron job de validação de links:', error);
            }
        }
    }

    /**
     * Implementação interna da validação de links
     */
    private async validateActiveCampaignsLinksInternal() {
        if (!this || !this.logger) {
            console.error('[CampaignsService] Contexto this/logger indisponível em validateActiveCampaignsLinksInternal');
            return;
        }

        this.logger.log('🔄 Iniciando validação de links de todas as campanhas...');
        
        try {
            const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
            
            // Buscar todas as campanhas que possuem link (ativas e inativas)
            const result = await Repository.findAll(CampaignsEntity, {
                // Sem filtro de active para buscar TODAS as campanhas
            }, [], {
                take: 10000
            });

            const campaigns = result?.data || [];
            const campaignsWithLinks = campaigns.filter((campaign: any) => campaign.link && campaign.link.trim());
            
            this.logger.log(`📊 Encontradas ${campaignsWithLinks.length} campanhas com links para validar`);

            let validated = 0;
            let okCount = 0;
            let brokenCount = 0;

            // Validar cada link
            for (const campaign of campaignsWithLinks) {
                try {
                    const linkStatus = await this.linkValidatorService.validateLink(campaign.link);
                    
                    // Atualizar o status do link no banco
                    await Repository.update(CampaignsEntity, {
                        id: campaign.id
                    }, {
                        linkStatus: linkStatus
                    });

                    validated++;
                    if (linkStatus === 'OK') {
                        okCount++;
                    } else {
                        brokenCount++;
                    }

                    // Pequeno delay para não sobrecarregar o servidor
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error: any) {
                    this.logger.error(`Erro ao validar link da campanha ${campaign.id}:`, error);
                }
            }

            this.logger.log(`✅ Validação concluída: ${validated} links validados (${okCount} OK, ${brokenCount} Quebrados)`);
            
            return {
                total: campaignsWithLinks.length,
                validated,
                ok: okCount,
                broken: brokenCount
            };
        } catch (error: any) {
            this.logger.error('❌ Erro ao validar links de campanhas:', error);
            throw error;
        }
    }

    /**
     * Valida o link de uma campanha específica
     * @param campaignId - ID da campanha
     */
    async validateCampaignLink(campaignId: string) {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        
        const campaign = await Repository.findOne(CampaignsEntity, {
            id: campaignId
        });

        if (!campaign) {
            throw new Error(`Campanha com ID ${campaignId} não encontrada`);
        }

        if (!campaign.link || !campaign.link.trim()) {
            // Se não tem link, remover status
            await Repository.update(CampaignsEntity, {
                id: campaignId
            }, {
                linkStatus: null
            });
            return { linkStatus: null };
        }

        const linkStatus = await this.linkValidatorService.validateLink(campaign.link);
        
        await Repository.update(CampaignsEntity, {
            id: campaignId
        }, {
            linkStatus: linkStatus
        });

        return { linkStatus };
    }
}




