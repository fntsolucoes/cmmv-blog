import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class PaymentChecklistService {
    /**
     * Buscar checklist por ano e mês
     */
    async getChecklistByMonth(year: number, month: number) {
        const ChecklistEntity = Repository.getEntity("SasPaymentChecklistEntity");
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");

        // Buscar todos os parceiros (Rede e Direto)
        const partnersResult = await Repository.findAll(CommercialPartnersEntity, {
            limit: 10000
        }, []);

        const partners = partnersResult?.data || [];

        // Buscar checklist existente para o mês/ano
        const checklistResult = await Repository.findAll(ChecklistEntity, {
            year,
            month,
            limit: 10000
        }, []);

        const checklistMap = new Map();
        (checklistResult?.data || []).forEach((item: any) => {
            checklistMap.set(item.commercialPartnerId, item);
        });

        // Combinar parceiros com checklist
        const result = partners.map((partner: any) => {
            const checklistItem = checklistMap.get(partner.id);
            return {
                partner: {
                    id: partner.id,
                    name: partner.name,
                    partnerType: partner.partnerType
                },
                checklist: checklistItem ? {
                    id: checklistItem.id,
                    capturedValue: checklistItem.capturedValue || 0,
                    validatedValue: checklistItem.validatedValue || 0,
                    rejectedValue: checklistItem.rejectedValue || 0,
                    invoiceIssued: checklistItem.invoiceIssued || false,
                    paymentOrderId: checklistItem.paymentOrderId || null
                } : {
                    id: null,
                    capturedValue: 0,
                    validatedValue: 0,
                    rejectedValue: 0,
                    invoiceIssued: false,
                    paymentOrderId: null
                }
            };
        });

        return { data: result };
    }

    /**
     * Salvar ou atualizar item do checklist
     */
    async saveChecklistItem(data: {
        commercialPartnerId: string;
        year: number;
        month: number;
        capturedValue?: number;
        validatedValue?: number;
        rejectedValue?: number;
        invoiceIssued?: boolean;
        paymentOrderId?: string | null;
    }) {
        const ChecklistEntity = Repository.getEntity("SasPaymentChecklistEntity");

        // Verificar se já existe
        const existing = await Repository.findAll(ChecklistEntity, {
            commercialPartnerId: data.commercialPartnerId,
            year: data.year,
            month: data.month,
            limit: 1
        }, []);

        const checklistData: any = {
            commercialPartnerId: data.commercialPartnerId,
            year: data.year,
            month: data.month,
            capturedValue: data.capturedValue ?? 0,
            validatedValue: data.validatedValue ?? 0,
            rejectedValue: data.rejectedValue ?? 0,
            invoiceIssued: data.invoiceIssued ?? false,
            paymentOrderId: data.paymentOrderId || null
        };

        if (existing?.data && existing.data.length > 0) {
            // Atualizar
            const item = existing.data[0];
            return await Repository.update(ChecklistEntity, item.id, checklistData);
        } else {
            // Criar novo
            return await Repository.insert(ChecklistEntity, checklistData);
        }
    }

    /**
     * Buscar ordens de pagamento disponíveis para anexar
     */
    async getAvailablePaymentOrders(commercialPartnerId: string, year: number, month: number) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        
        const expectedPaymentMonth = `${year}-${String(month).padStart(2, '0')}`;
        
        const result = await Repository.findAll(PaymentOrdersEntity, {
            commercialPartnerId,
            expectedPaymentMonth,
            limit: 10000
        }, []);

        return result;
    }
}

