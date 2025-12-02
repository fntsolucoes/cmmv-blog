import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class TicketPartnersService {
    /**
     * Buscar todos os parceiros de tickets ativos
     */
    async getAllPartners() {
        const TicketPartnersEntity = Repository.getEntity("SasTicketPartnersEntity");
        const result = await Repository.findAll(TicketPartnersEntity, { active: true }, [], {
            order: {
                isDefault: 'DESC',
                name: 'ASC'
            },
            take: 1000
        });
        
        // Ordenar manualmente se necessário (fallback)
        if (result?.data) {
            result.data.sort((a: any, b: any) => {
                // Primeiro por isDefault (true primeiro)
                if (a.isDefault !== b.isDefault) {
                    return b.isDefault ? 1 : -1;
                }
                // Depois por nome
                return (a.name || '').localeCompare(b.name || '');
            });
        }
        
        return result;
    }

    /**
     * Buscar todos os parceiros (incluindo inativos)
     */
    async getAllPartnersIncludingInactive() {
        const TicketPartnersEntity = Repository.getEntity("SasTicketPartnersEntity");
        const result = await Repository.findAll(TicketPartnersEntity, {}, [], {
            order: {
                isDefault: 'DESC',
                name: 'ASC'
            },
            take: 1000
        });
        
        // Ordenar manualmente se necessário (fallback)
        if (result?.data) {
            result.data.sort((a: any, b: any) => {
                // Primeiro por isDefault (true primeiro)
                if (a.isDefault !== b.isDefault) {
                    return b.isDefault ? 1 : -1;
                }
                // Depois por nome
                return (a.name || '').localeCompare(b.name || '');
            });
        }
        
        return result;
    }

    /**
     * Buscar parceiro padrão
     */
    async getDefaultPartner() {
        const TicketPartnersEntity = Repository.getEntity("SasTicketPartnersEntity");
        return await Repository.findOne(TicketPartnersEntity, { 
            isDefault: true,
            active: true
        });
    }

    /**
     * Buscar parceiro por ID
     */
    async getPartnerById(id: string) {
        const TicketPartnersEntity = Repository.getEntity("SasTicketPartnersEntity");
        return await Repository.findOne(TicketPartnersEntity, { id });
    }
}

