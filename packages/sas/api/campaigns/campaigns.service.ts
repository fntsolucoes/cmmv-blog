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
        return await Repository.findAll(CampaignsEntity, {
            commercialPartnerId: partnerId,
            limit: 10000  // Limite alto para pegar todas as campanhas
        }, [], {
            order: {
                startDate: 'DESC'
            }
        });
    }
}




