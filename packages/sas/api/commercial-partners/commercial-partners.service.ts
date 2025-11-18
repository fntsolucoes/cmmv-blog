import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class CommercialPartnersService {
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
}




