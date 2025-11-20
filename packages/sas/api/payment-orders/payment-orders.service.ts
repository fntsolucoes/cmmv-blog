import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class PaymentOrdersService {
    /**
     * Validar mês (1-12)
     */
    private validateMonth(month: number): boolean {
        return month >= 1 && month <= 12;
    }

    /**
     * Validar ano
     */
    private validateYear(year: number): boolean {
        return year >= 2000 && year <= 2100;
    }

    /**
     * Calcular valor líquido (valor emitido - imposto)
     */
    calculateNetValue(invoiceAmount: number, taxAmount: number): number {
        return invoiceAmount - taxAmount;
    }

    /**
     * Montar string YYYY-MM a partir de mês/ano numéricos
     */
    private buildExpectedPaymentMonth(year: number, month: number): string {
        const monthStr = String(month).padStart(2, '0');
        return `${year}-${monthStr}`;
    }

    /**
     * Criar nova ordem de pagamento
     * Regras baseadas no PaymentOrderService do projeto 1001div.
     */
    async create(data: {
        commercialPartnerId: string;
        costCenterId: string;
        currency: string;
        invoiceAmount: number;
        taxAmount: number;
        withdrawalDate: string | Date;
        expectedPaymentMonth: number;
        expectedPaymentYear: number;
        effectivePaymentDate?: string | Date | null;
        status?: string;
        paidValue?: number | null;
        paymentMethod?: string | null;
        observations?: string | null;
    }) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");

        // Validar valores numéricos
        if (data.invoiceAmount <= 0) {
            throw new Error("Invoice value must be greater than zero");
        }

        if (data.taxAmount < 0) {
            throw new Error("Tax value cannot be negative");
        }

        if (data.taxAmount > data.invoiceAmount) {
            throw new Error("Tax value cannot exceed invoice value");
        }

        // Validar mês/ano
        if (!this.validateMonth(data.expectedPaymentMonth)) {
            throw new Error("Expected payment month must be between 1 and 12");
        }

        if (!this.validateYear(data.expectedPaymentYear)) {
            throw new Error("Expected payment year must be between 2000 and 2100");
        }

        // Validar data de saque (não pode ser futura)
        // Normalizar data para UTC com meio-dia para evitar problemas de timezone
        let withdrawalDate: Date;
        if (typeof data.withdrawalDate === 'string') {
            // Se for string no formato YYYY-MM-DD, criar Date em UTC
            if (data.withdrawalDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = data.withdrawalDate.split('-').map(Number);
                withdrawalDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
            } else {
                withdrawalDate = new Date(data.withdrawalDate);
            }
        } else {
            withdrawalDate = new Date(data.withdrawalDate);
        }
        
        // Normalizar para UTC com meio-dia
        withdrawalDate = new Date(Date.UTC(
            withdrawalDate.getUTCFullYear(),
            withdrawalDate.getUTCMonth(),
            withdrawalDate.getUTCDate(),
            12, 0, 0, 0
        ));
        
        // Comparar com hoje em UTC
        const today = new Date();
        const todayUTC = new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
            23, 59, 59, 999
        ));

        if (withdrawalDate.getTime() > todayUTC.getTime()) {
            throw new Error("Withdrawal date cannot be in the future");
        }

        // Verificar parceiro comercial
        const partner = await Repository.findOne(CommercialPartnersEntity, {
            id: data.commercialPartnerId
        });

        if (!partner) {
            throw new Error("Partner not found");
        }

        // Verificar centro de custos (empresa)
        const costCenter = await Repository.findOne(CostCentersEntity, {
            id: data.costCenterId
        });

        if (!costCenter) {
            throw new Error("Cost center not found");
        }

        const expectedPaymentMonthStr = this.buildExpectedPaymentMonth(
            data.expectedPaymentYear,
            data.expectedPaymentMonth
        );

        // Preparar payload para inserção
        const payload: any = {
            commercialPartnerId: data.commercialPartnerId,
            costCenterId: data.costCenterId,
            currency: data.currency,
            invoiceAmount: data.invoiceAmount,
            taxAmount: data.taxAmount,
            withdrawalDate,
            expectedPaymentMonth: expectedPaymentMonthStr,
            status: data.status || "Pendente",
            effectivePaymentDate: null,
            paidValue: data.paidValue ?? null,
            paymentMethod: data.paymentMethod ?? null,
            observations: data.observations ?? null
        };

        // Se status for Pago, exigir data de pagamento
        if (payload.status === "Pago") {
            if (!data.effectivePaymentDate) {
                throw new Error('Effective payment date is required when status is "Pago"');
            }

            // Normalizar data para UTC com meio-dia para evitar problemas de timezone
            let paymentDate: Date;
            if (typeof data.effectivePaymentDate === 'string') {
                // Se for string no formato YYYY-MM-DD, criar Date em UTC
                if (data.effectivePaymentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = data.effectivePaymentDate.split('-').map(Number);
                    paymentDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
                } else {
                    paymentDate = new Date(data.effectivePaymentDate);
                }
            } else {
                paymentDate = new Date(data.effectivePaymentDate);
            }
            
            // Normalizar para UTC com meio-dia
            paymentDate = new Date(Date.UTC(
                paymentDate.getUTCFullYear(),
                paymentDate.getUTCMonth(),
                paymentDate.getUTCDate(),
                12, 0, 0, 0
            ));
            
            if (paymentDate.getTime() > todayUTC.getTime()) {
                throw new Error("Effective payment date cannot be in the future");
            }

            payload.effectivePaymentDate = paymentDate;
        }

        const result = await Repository.insert(PaymentOrdersEntity, payload);
        return result;
    }

    /**
     * Atualizar ordem de pagamento
     */
    async update(id: string, data: Partial<{
        commercialPartnerId: string;
        costCenterId: string;
        currency: string;
        invoiceAmount: number;
        taxAmount: number;
        withdrawalDate: string | Date | null;
        expectedPaymentMonth: number;
        expectedPaymentYear: number;
        effectivePaymentDate: string | Date | null;
        status: string;
        paidValue: number | null;
        paymentMethod: string | null;
        observations: string | null;
    }>) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");

        const existing = await Repository.findOne(PaymentOrdersEntity, { id });
        if (!existing) {
            throw new Error("Payment order not found");
        }

        const payload: any = {};

        // Atualizar valores com validações
        if (data.invoiceAmount !== undefined) {
            if (data.invoiceAmount <= 0) {
                throw new Error("Invoice value must be greater than zero");
            }
            payload.invoiceAmount = data.invoiceAmount;
        }

        if (data.taxAmount !== undefined) {
            if (data.taxAmount < 0) {
                throw new Error("Tax value cannot be negative");
            }
            const invoiceAmount = data.invoiceAmount ?? existing.invoiceAmount;
            if (data.taxAmount > invoiceAmount) {
                throw new Error("Tax value cannot exceed invoice value");
            }
            payload.taxAmount = data.taxAmount;
        }

        if (data.expectedPaymentMonth !== undefined) {
            if (!this.validateMonth(data.expectedPaymentMonth)) {
                throw new Error("Expected payment month must be between 1 and 12");
            }
        }

        if (data.expectedPaymentYear !== undefined) {
            if (!this.validateYear(data.expectedPaymentYear)) {
                throw new Error("Expected payment year must be between 2000 and 2100");
            }
        }

        if (data.expectedPaymentMonth !== undefined || data.expectedPaymentYear !== undefined) {
            const month = data.expectedPaymentMonth ?? this.extractMonth(existing.expectedPaymentMonth);
            const year = data.expectedPaymentYear ?? this.extractYear(existing.expectedPaymentMonth);
            payload.expectedPaymentMonth = this.buildExpectedPaymentMonth(year, month);
        }

        if (data.withdrawalDate !== undefined) {
            if (data.withdrawalDate === null) {
                payload.withdrawalDate = null;
            } else {
                // Normalizar data para UTC com meio-dia para evitar problemas de timezone
                let withdrawalDate: Date;
                if (typeof data.withdrawalDate === 'string') {
                    // Se for string no formato YYYY-MM-DD, criar Date em UTC
                    if (data.withdrawalDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const [year, month, day] = data.withdrawalDate.split('-').map(Number);
                        withdrawalDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
                    } else {
                        withdrawalDate = new Date(data.withdrawalDate);
                    }
                } else {
                    withdrawalDate = new Date(data.withdrawalDate);
                }
                
                // Normalizar para UTC com meio-dia
                withdrawalDate = new Date(Date.UTC(
                    withdrawalDate.getUTCFullYear(),
                    withdrawalDate.getUTCMonth(),
                    withdrawalDate.getUTCDate(),
                    12, 0, 0, 0
                ));
                
                // Comparar com hoje em UTC
                const today = new Date();
                const todayUTC = new Date(Date.UTC(
                    today.getUTCFullYear(),
                    today.getUTCMonth(),
                    today.getUTCDate(),
                    23, 59, 59, 999
                ));
                
                if (withdrawalDate.getTime() > todayUTC.getTime()) {
                    throw new Error("Withdrawal date cannot be in the future");
                }
                payload.withdrawalDate = withdrawalDate;
            }
        }

        // Validar parceiro comercial se informado
        if (data.commercialPartnerId !== undefined) {
            const partner = await Repository.findOne(CommercialPartnersEntity, {
                id: data.commercialPartnerId
            });
            if (!partner) {
                throw new Error("Partner not found");
            }
            payload.commercialPartnerId = data.commercialPartnerId;
        }

        // Validar centro de custos se informado
        if (data.costCenterId !== undefined) {
            const costCenter = await Repository.findOne(CostCentersEntity, {
                id: data.costCenterId
            });
            if (!costCenter) {
                throw new Error("Cost center not found");
            }
            payload.costCenterId = data.costCenterId;
        }

        if (data.currency !== undefined) {
            payload.currency = data.currency;
        }

        if (data.effectivePaymentDate !== undefined) {
            if (data.effectivePaymentDate === null) {
                payload.effectivePaymentDate = null;
            } else {
                // Normalizar data para UTC com meio-dia para evitar problemas de timezone
                let paymentDate: Date;
                if (typeof data.effectivePaymentDate === 'string') {
                    // Se for string no formato YYYY-MM-DD, criar Date em UTC
                    if (data.effectivePaymentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const [year, month, day] = data.effectivePaymentDate.split('-').map(Number);
                        paymentDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
                    } else {
                        paymentDate = new Date(data.effectivePaymentDate);
                    }
                } else {
                    paymentDate = new Date(data.effectivePaymentDate);
                }
                
                // Normalizar para UTC com meio-dia
                paymentDate = new Date(Date.UTC(
                    paymentDate.getUTCFullYear(),
                    paymentDate.getUTCMonth(),
                    paymentDate.getUTCDate(),
                    12, 0, 0, 0
                ));
                
                // Comparar com hoje em UTC
                const today = new Date();
                const todayUTC = new Date(Date.UTC(
                    today.getUTCFullYear(),
                    today.getUTCMonth(),
                    today.getUTCDate(),
                    23, 59, 59, 999
                ));
                
                if (paymentDate.getTime() > todayUTC.getTime()) {
                    throw new Error("Effective payment date cannot be in the future");
                }
                payload.effectivePaymentDate = paymentDate;
            }
        }

        if (data.status !== undefined) {
            payload.status = data.status;
        }

        if (data.paidValue !== undefined) {
            if (data.paidValue !== null && data.paidValue < 0) {
                throw new Error("Paid value cannot be negative");
            }
            payload.paidValue = data.paidValue;
        }

        if (data.paymentMethod !== undefined) {
            payload.paymentMethod = data.paymentMethod;
        }

        if (data.observations !== undefined) {
            payload.observations = data.observations;
        }

        const result = await Repository.update(PaymentOrdersEntity, id, payload);
        return result;
    }

    /**
     * Atualizar status da ordem de pagamento
     */
    async updateStatus(id: string, status: string, effectivePaymentDate?: string | Date | null, paidValue?: number | null) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");

        const existing = await Repository.findOne(PaymentOrdersEntity, { id });
        if (!existing) {
            throw new Error("Payment order not found");
        }

        const payload: any = {};

        if (status === "Pago") {
            if (!effectivePaymentDate) {
                throw new Error('Effective payment date is required when status is "Pago"');
            }

            // Normalizar data para UTC com meio-dia para evitar problemas de timezone
            let paymentDate: Date;
            if (typeof effectivePaymentDate === 'string') {
                // Se for string no formato YYYY-MM-DD, criar Date em UTC
                if (effectivePaymentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = effectivePaymentDate.split('-').map(Number);
                    paymentDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
                } else {
                    paymentDate = new Date(effectivePaymentDate);
                }
            } else {
                paymentDate = new Date(effectivePaymentDate);
            }
            
            // Normalizar para UTC com meio-dia
            paymentDate = new Date(Date.UTC(
                paymentDate.getUTCFullYear(),
                paymentDate.getUTCMonth(),
                paymentDate.getUTCDate(),
                12, 0, 0, 0
            ));
            
            // Comparar com hoje em UTC
            const today = new Date();
            const todayUTC = new Date(Date.UTC(
                today.getUTCFullYear(),
                today.getUTCMonth(),
                today.getUTCDate(),
                23, 59, 59, 999
            ));
            
            if (paymentDate.getTime() > todayUTC.getTime()) {
                throw new Error("Effective payment date cannot be in the future");
            }

            payload.effectivePaymentDate = paymentDate;

            if (paidValue !== undefined && paidValue !== null) {
                if (paidValue < 0) {
                    throw new Error("Paid value cannot be negative");
                }
                payload.paidValue = paidValue;
            } else if (!existing.paidValue || existing.paidValue === 0) {
                // Se não informado, usar valor líquido convertido (em BRL) será responsabilidade de outra camada
                const netValue = this.calculateNetValue(existing.invoiceAmount, existing.taxAmount);
                payload.paidValue = netValue;
            }
        } else {
            // Se voltar para pendente, limpar data e valor pago
            payload.effectivePaymentDate = null;
            payload.paidValue = null;
        }

        payload.status = status;

        const result = await Repository.update(PaymentOrdersEntity, id, payload);
        return result;
    }

    /**
     * Listar ordens de pagamento com filtros simples
     */
    async findAll(filters: any = {}) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const queryFilters: any = {};

        if (filters.commercialPartnerId) {
            queryFilters.commercialPartnerId = filters.commercialPartnerId;
        }

        if (filters.costCenterId) {
            queryFilters.costCenterId = filters.costCenterId;
        }

        if (filters.status) {
            queryFilters.status = filters.status;
        }

        if (filters.limit) {
            queryFilters.limit = parseInt(filters.limit, 10);
        }

        const result = await Repository.findAll(PaymentOrdersEntity, queryFilters);
        return result;
    }

    /**
     * Buscar ordem por ID
     */
    async findById(id: string) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const order = await Repository.findOne(PaymentOrdersEntity, { id });
        return order;
    }

    /**
     * Excluir ordem (soft delete, se suportado pela entidade)
     */
    async delete(id: string) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        return await Repository.delete(PaymentOrdersEntity, id);
    }

    /**
     * Extrair mês numérico de uma string YYYY-MM
     */
    private extractMonth(value: string | null | undefined): number {
        if (!value) return 1;
        const parts = value.split("-");
        if (parts.length !== 2) return 1;
        const month = parseInt(parts[1], 10);
        return isNaN(month) ? 1 : month;
    }

    /**
     * Extrair ano numérico de uma string YYYY-MM
     */
    private extractYear(value: string | null | undefined): number {
        if (!value) return new Date().getFullYear();
        const parts = value.split("-");
        if (parts.length !== 2) return new Date().getFullYear();
        const year = parseInt(parts[0], 10);
        return isNaN(year) ? new Date().getFullYear() : year;
    }

    /**
     * Calcular valor líquido (valor emitido - imposto)
     */
    async calculateNetAmount(orderId: string) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const order = await Repository.findOne(PaymentOrdersEntity, { id: orderId });

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



