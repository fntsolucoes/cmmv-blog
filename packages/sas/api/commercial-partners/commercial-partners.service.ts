import {
    Service, Logger, Cron
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import {
    LinkValidatorService
} from "../campaigns/link-validator.service";

@Service()
export class CommercialPartnersService {
    private readonly logger = new Logger("CommercialPartnersService");
    private readonly linkValidatorService = new LinkValidatorService();
    /**
     * Buscar histórico de ordens de pagamento de um parceiro
     */
    async getPaymentOrdersHistory(partnerId: string) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        return await Repository.findAll(PaymentOrdersEntity, {
            where: { commercialPartnerId: partnerId },
            limit: 1000,
            orderBy: { withdrawalDate: 'DESC' }
        });
    }

    /**
     * Buscar parceiro comercial por ID
     */
    async getPartnerById(id: string) {
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
        return await Repository.findOne(CommercialPartnersEntity, { id }, []);
    }

    /**
     * Buscar todos os parceiros comerciais sem limite
     * Garante que todos os registros sejam retornados
     */
    async getAllPartners() {
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
        
        console.log(`[getAllPartners] Buscando todos os parceiros comerciais...`);
        
        // Primeiro, contar quantos parceiros existem
        const totalCount = await Repository.count(CommercialPartnersEntity, {});
        
        console.log(`[getAllPartners] Total de parceiros no banco: ${totalCount}`);
        
        // Buscar todos os parceiros usando limite alto
        const result = await Repository.findAll(CommercialPartnersEntity, {
            limit: 10000  // Limite alto para pegar todos os parceiros
        }, []);
        
        const returnedCount = result?.data?.length || 0;
        console.log(`[getAllPartners] Parceiros retornados: ${returnedCount} de ${totalCount} esperados`);
        
        // Se retornou menos que o total e exatamente 10, pode haver limite padrão
        if (returnedCount < totalCount && returnedCount === 10) {
            console.log(`[getAllPartners] ⚠️ Limite padrão detectado! Tentando buscar sem filtros...`);
            
            // Tentar buscar sem nenhum filtro
            const resultUnfiltered = await Repository.findAll(CommercialPartnersEntity, {
                limit: 10000
            }, []);
            
            const unfilteredCount = resultUnfiltered?.data?.length || 0;
            console.log(`[getAllPartners] Parceiros retornados sem filtros: ${unfilteredCount}`);
            
            if (unfilteredCount >= totalCount) {
                console.log(`[getAllPartners] ✅ Retornando ${unfilteredCount} parceiros`);
                return resultUnfiltered;
            }
        }
        
        console.log(`[getAllPartners] ✅ Retornando ${returnedCount} parceiros`);
        return result;
    }

    /**
     * Valida links de todos os parceiros diretos ativos
     * Inclui na rotina de validação a cada 2 horas
     */
    @Cron('5 */2 * * *') // A cada 2 horas, com pequeno offset
    validateDirectPartnersLinks = async () => {
        // Arrow function preserva automaticamente o contexto 'this'
        try {
            return await this.validateDirectPartnersLinksInternal();
        } catch (error: any) {
            // Fallback: usar console.error se logger não estiver disponível
            if (this.logger) {
                this.logger.error('[CommercialPartnersService] Erro no cron job de validação de links:', error);
            } else {
                console.error('[CommercialPartnersService] Erro no cron job de validação de links:', error);
            }
        }
    }

    /**
     * Implementação interna da validação de links de parceiros diretos
     */
    private async validateDirectPartnersLinksInternal() {
        this.logger.log('🔄 Iniciando validação de links de parceiros diretos ativos...');

        try {
            const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");

            // Buscar todos os parceiros do tipo Direto
            const result = await Repository.findAll(CommercialPartnersEntity, {
                partnerType: 'Direto'
            }, [], {
                limit: 10000
            });

            const partners = result?.data || [];
            const partnersWithLinks = partners.filter((partner: any) => partner.link && partner.link.trim());

            this.logger.log(`📊 Encontrados ${partnersWithLinks.length} parceiros diretos ativos com links para validar`);

            let validated = 0;
            let okCount = 0;
            let brokenCount = 0;

            for (const partner of partnersWithLinks) {
                try {
                    const linkStatus = await this.linkValidatorService.validateLink(partner.link);

                    await Repository.update(CommercialPartnersEntity, {
                        id: partner.id
                    }, {
                        linkStatus
                    });

                    validated++;
                    if (linkStatus === 'OK') {
                        okCount++;
                    } else {
                        brokenCount++;
                    }

                    // Pequeno delay para evitar sobrecarga
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error: any) {
                    this.logger.error(`Erro ao validar link do parceiro direto ${partner.id}:`, error);
                }
            }

            this.logger.log(`✅ Validação de parceiros diretos concluída: ${validated} links validados (${okCount} OK, ${brokenCount} Quebrados)`);

            return {
                total: partnersWithLinks.length,
                validated,
                ok: okCount,
                broken: brokenCount
            };
        } catch (error: any) {
            this.logger.error('❌ Erro ao validar links de parceiros diretos:', error);
            throw error;
        }
    }

    /**
     * Valida o link de um parceiro direto específico
     * @param partnerId - ID do parceiro comercial
     */
    async validateDirectPartnerLink(partnerId: string) {
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");

        const partner = await Repository.findOne(CommercialPartnersEntity, {
            id: partnerId
        }, []);

        if (!partner) {
            throw new Error(`Parceiro comercial com ID ${partnerId} não encontrado`);
        }

        if (!partner.link || !partner.link.trim()) {
            await Repository.update(CommercialPartnersEntity, {
                id: partnerId
            }, {
                linkStatus: null
            });

            return { linkStatus: null };
        }

        const linkStatus = await this.linkValidatorService.validateLink(partner.link);

        await Repository.update(CommercialPartnersEntity, {
            id: partnerId
        }, {
            linkStatus
        });

        return { linkStatus };
    }
}




