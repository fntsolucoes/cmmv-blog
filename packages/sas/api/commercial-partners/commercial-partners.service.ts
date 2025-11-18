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
}




