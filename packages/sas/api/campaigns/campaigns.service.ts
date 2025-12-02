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
        return await Repository.findAll(CampaignsEntity, {
            where: { 
                commercialPartnerId: partnerId,
                active: true
            },
            limit: 1000
        });
    }

    /**
     * Buscar todas as campanhas de um parceiro (ativas e inativas)
     * Limitado a 1000 registros por query (limite máximo do repositório)
     */
    async getAllCampaignsByPartner(partnerId: string) {
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");

        console.log(`[getAllCampaignsByPartner] Buscando campanhas para parceiro ${partnerId}`);

        // Primeiro, contar quantas campanhas existem
        const totalCount = await Repository.count(CampaignsEntity, {
            commercialPartnerId: partnerId
        });

        console.log(`[getAllCampaignsByPartner] Total de campanhas no banco: ${totalCount}`);

        // Buscar campanhas com limite máximo permitido
        const result = await Repository.findAll(CampaignsEntity, {
            commercialPartnerId: partnerId,
            limit: 1000 // Limite máximo permitido pelo repositório
        }, [], {
            order: {
                startDate: 'DESC'
            }
        });

        const returnedCount = result?.data?.length || 0;
        console.log(`[getAllCampaignsByPartner] Campanhas retornadas: ${returnedCount} de ${totalCount} esperadas`);

        if (totalCount > 1000) {
            console.log(`[getAllCampaignsByPartner] ATENCAO: Existem ${totalCount} campanhas no banco, mas apenas 1000 podem ser retornadas por query. Considere implementar paginacao.`);
        }

        console.log(`[getAllCampaignsByPartner] Retornando ${returnedCount} campanhas`);
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
        
        // Buscar todas as campanhas usando limite máximo permitido
        const result = await Repository.findAll(CampaignsEntity, {
            limit: 1000  // Limite máximo permitido pelo repositório
        }, [], {
            order: {
                startDate: 'DESC'
            }
        });
        
        const returnedCount = result?.data?.length || 0;
        console.log(`[getAllCampaigns] Campanhas retornadas: ${returnedCount} de ${totalCount} esperadas`);
        
        // Se houver mais campanhas que o limite, avisar
        if (totalCount > 1000) {
            console.log(`[getAllCampaigns] ATENCAO: Existem ${totalCount} campanhas no banco, mas apenas 1000 podem ser retornadas por query. Considere implementar paginacao.`);
        }
        
        console.log(`[getAllCampaigns] Retornando ${returnedCount} campanhas`);
        return result;
    }

    /**
     * Valida links de todas as campanhas (ativas e inativas) que possuem links
     * Roda automaticamente a cada 2 horas via cron job
     */
    @Cron('0 */2 * * *') // A cada 2 horas
    async validateActiveCampaignsLinks() {
        try {
            return await this.validateActiveCampaignsLinksInternal();
        } catch (error: any) {
            // Fallback: usar console.error se logger não estiver disponível
            if (this.logger) {
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

            this.logger.log(`Validacao concluida: ${validated} links validados (${okCount} OK, ${brokenCount} Quebrados)`);
            
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




