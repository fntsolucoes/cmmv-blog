import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class CampaignsService {
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
        
        const returnedCount = result?.data?.length || 0;
        console.log(`[getAllCampaigns] Campanhas retornadas: ${returnedCount} de ${totalCount} esperadas`);
        
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
}




