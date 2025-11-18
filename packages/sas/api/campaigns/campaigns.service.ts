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
}




