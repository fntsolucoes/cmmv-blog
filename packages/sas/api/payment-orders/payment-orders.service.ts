import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class PaymentOrdersService {
    /**
     * Calcular valor líquido (valor emitido - imposto)
     */
    async calculateNetAmount(orderId: string) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const order = await Repository.findOne(PaymentOrdersEntity, { where: { id: orderId } });
        
        if (!order) {
            throw new Error("Order not found");
        }

        return {
            invoiceAmount: order.invoiceAmount,
            taxAmount: order.taxAmount,
            netAmount: order.invoiceAmount - order.taxAmount
        };
    }
}

