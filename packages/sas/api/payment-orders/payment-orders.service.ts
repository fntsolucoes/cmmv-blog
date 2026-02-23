import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import { parse } from "csv-parse/sync";
import { TaxCalcService } from "../tax-calc/tax-calc.service";

@Service()
export class PaymentOrdersService {
    constructor(private readonly taxCalcService: TaxCalcService) {}

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
     * Calcular taxAmount a partir do percentual sobre o valor da fatura.
     * taxAmount nao e enviado pelo usuario; o sistema calcula para evitar erros.
     */
    private calculateTaxAmount(invoiceAmount: number, taxPercentage: number): number {
        const pct = Math.max(0, Math.min(100, taxPercentage));
        return Math.round(invoiceAmount * (pct / 100) * 100) / 100;
    }

    /**
     * Criar nova ordem de pagamento
     * Regras baseadas no PaymentOrderService do projeto 1001div.
     * taxAmount e calculado pelo sistema a partir de taxPercentage (nao enviado pelo usuario).
     */
    async create(data: {
        commercialPartnerId: string;
        costCenterId: string;
        currency: string;
        invoiceAmount: number;
        taxPercentage?: number;
        discountAmount?: number;
        withdrawalDate: string | Date;
        expectedPaymentMonth: number;
        expectedPaymentYear: number;
        effectivePaymentDate?: string | Date | null;
        status?: string;
        paidValue?: number | null;
        paymentMethod?: string | null;
        observations?: string | null;
        natureza_rendimento?: string | null;
        mes_referencia_nota?: string | null;
        tax_engine_used?: number | boolean | null;
        tax_calc_details?: string | object | null;
    }) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");

        // Validar valores numéricos
        if (data.invoiceAmount <= 0) {
            throw new Error("O valor da nota deve ser maior que zero.");
        }

        // taxAmount: motor de tributos (Simples, Lucro Presumido, etc.) ou percentual manual
        let taxAmount: number;
        let taxEngineUsed = false;
        let taxCalcDetails: string | null = null;
        let irpjAdicionalAmount = 0;
        const referenceMonth = this.buildExpectedPaymentMonth(data.expectedPaymentYear, data.expectedPaymentMonth);
        try {
            const calcResult = await this.taxCalcService.calculate({
                costCenterId: data.costCenterId,
                grossAmount: data.invoiceAmount,
                referenceMonth,
                mesReferenciaNota: data.mes_referencia_nota ?? undefined
            });
            if (calcResult != null && typeof calcResult.totalDeductions === "number" && calcResult.totalDeductions >= 0) {
                taxAmount = Math.round(calcResult.totalDeductions * 100) / 100;
                taxEngineUsed = true;
                taxCalcDetails = JSON.stringify(calcResult);
                irpjAdicionalAmount = this.extractIrpjAdicional(calcResult);
            } else {
                taxAmount = this.calculateTaxAmount(data.invoiceAmount, data.taxPercentage ?? 0);
            }
        } catch (_) {
            taxAmount = this.calculateTaxAmount(data.invoiceAmount, data.taxPercentage ?? 0);
        }
        if (taxAmount < 0) {
            throw new Error("O valor do imposto não pode ser negativo.");
        }
        if (taxAmount > data.invoiceAmount) {
            throw new Error("O valor do imposto não pode exceder o valor da nota.");
        }

        // Validar desconto
        const discountAmount = data.discountAmount ?? 0;
        if (discountAmount < 0) {
            throw new Error("O valor do desconto não pode ser negativo.");
        }

        // Validar que imposto + desconto nao exceda o valor da fatura
        if (taxAmount + discountAmount > data.invoiceAmount) {
            throw new Error("Imposto e desconto combinados não podem exceder o valor da nota.");
        }

        // Validar mês/ano
        if (!this.validateMonth(data.expectedPaymentMonth)) {
            throw new Error("O mês de previsão de pagamento deve estar entre 1 e 12.");
        }

        if (!this.validateYear(data.expectedPaymentYear)) {
            throw new Error("O ano de previsão de pagamento deve estar entre 2000 e 2100.");
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
            throw new Error("A Data de Saque não pode ser uma data futura.");
        }

        // Verificar parceiro comercial
        const partner = await Repository.findOne(CommercialPartnersEntity, {
            id: data.commercialPartnerId
        });

        if (!partner) {
            throw new Error("Parceiro comercial não encontrado.");
        }

        // Verificar centro de custos (empresa)
        const costCenter = await Repository.findOne(CostCentersEntity, {
            id: data.costCenterId
        });

        if (!costCenter) {
            throw new Error("Centro de custo não encontrado.");
        }

        const expectedPaymentMonthStr = this.buildExpectedPaymentMonth(
            data.expectedPaymentYear,
            data.expectedPaymentMonth
        );

        // Preparar payload para insercao (taxAmount calculado pelo sistema)
        const payload: any = {
            commercialPartnerId: data.commercialPartnerId,
            costCenterId: data.costCenterId,
            currency: data.currency,
            invoiceAmount: data.invoiceAmount,
            taxAmount,
            discountAmount: discountAmount,
            withdrawalDate,
            expectedPaymentMonth: expectedPaymentMonthStr,
            status: data.status || "Pendente",
            effectivePaymentDate: null,
            paidValue: data.paidValue ?? null,
            paymentMethod: data.paymentMethod ?? null,
            observations: data.observations ?? null
        };
        payload.tax_engine_used = data.tax_engine_used !== undefined && data.tax_engine_used !== null ? !!data.tax_engine_used : taxEngineUsed;
        payload.tax_calc_details = data.tax_calc_details !== undefined
            ? (typeof data.tax_calc_details === 'string' ? data.tax_calc_details : data.tax_calc_details != null ? JSON.stringify(data.tax_calc_details) : null)
            : taxCalcDetails;
        payload.irpj_adicional_amount = irpjAdicionalAmount;
        if (data.natureza_rendimento != null && data.natureza_rendimento !== "") {
            payload.natureza_rendimento = data.natureza_rendimento;
        }
        if (data.mes_referencia_nota != null && data.mes_referencia_nota !== "") {
            payload.mes_referencia_nota = String(data.mes_referencia_nota).trim();
        }
        if (data.invoice_cnae != null && data.invoice_cnae !== "") {
            payload.invoice_cnae = String(data.invoice_cnae).trim();
        }
        if (data.invoice_attachment != null && data.invoice_attachment !== "") {
            payload.invoice_attachment = String(data.invoice_attachment).trim();
        }

        // Se status for Pago, exigir data de pagamento
        if (payload.status === "Pago") {
            if (!data.effectivePaymentDate) {
                throw new Error('A data efetiva de pagamento é obrigatória quando o status é "Pago".');
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
                throw new Error("A data efetiva de pagamento não pode ser futura.");
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
        taxPercentage?: number;
        discountAmount?: number;
        withdrawalDate: string | Date | null;
        expectedPaymentMonth: number;
        expectedPaymentYear: number;
        effectivePaymentDate: string | Date | null;
        status: string;
        paidValue: number | null;
        paymentMethod: string | null;
        observations: string | null;
        natureza_rendimento: string | null;
        mes_referencia_nota: string | null;
        tax_engine_used: number | boolean | null;
        tax_calc_details: string | object | null;
    }>) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");

        const existing = await Repository.findOne(PaymentOrdersEntity, { id });
        if (!existing) {
            throw new Error("Ordem de pagamento não encontrada.");
        }

        const payload: any = {};

        // Atualizar valores com validações
        if (data.invoiceAmount !== undefined) {
            if (data.invoiceAmount <= 0) {
                throw new Error("O valor da nota deve ser maior que zero.");
            }
            payload.invoiceAmount = data.invoiceAmount;
        }

        // taxAmount: percentual manual ou motor de tributos (recalculo quando valor/mes mudam)
        if (data.taxPercentage !== undefined) {
            const invoiceAmount = data.invoiceAmount ?? existing.invoiceAmount;
            const taxAmount = this.calculateTaxAmount(invoiceAmount, data.taxPercentage);
            if (taxAmount < 0) {
                throw new Error("O valor do imposto não pode ser negativo.");
            }
            if (taxAmount > invoiceAmount) {
                throw new Error("O valor do imposto não pode exceder o valor da nota.");
            }
            payload.taxAmount = taxAmount;
        } else if (data.invoiceAmount !== undefined || data.expectedPaymentMonth !== undefined || data.expectedPaymentYear !== undefined || data.mes_referencia_nota !== undefined) {
            const invoiceAmount = data.invoiceAmount ?? existing.invoiceAmount;
            const referenceMonth = (data.expectedPaymentMonth !== undefined || data.expectedPaymentYear !== undefined)
                ? this.buildExpectedPaymentMonth(
                    data.expectedPaymentYear ?? this.extractYear(existing.expectedPaymentMonth),
                    data.expectedPaymentMonth ?? this.extractMonth(existing.expectedPaymentMonth)
                )
                : existing.expectedPaymentMonth;
            const mesRef = data.mes_referencia_nota ?? existing.mes_referencia_nota ?? (existing as any).mesReferenciaNota ?? undefined;
            try {
                const calcResult = await this.taxCalcService.calculate({
                    costCenterId: existing.costCenterId,
                    grossAmount: invoiceAmount,
                    referenceMonth,
                    orderId: id,
                    mesReferenciaNota: mesRef
                });
                if (calcResult != null && typeof calcResult.totalDeductions === "number" && calcResult.totalDeductions >= 0) {
                    payload.taxAmount = Math.round(calcResult.totalDeductions * 100) / 100;
                    payload.tax_engine_used = true;
                    payload.tax_calc_details = JSON.stringify(calcResult);
                    payload.irpj_adicional_amount = this.extractIrpjAdicional(calcResult);
                }
            } catch (_) {
                // mantem valores atuais
            }
        }

        if (data.discountAmount !== undefined) {
            if (data.discountAmount < 0) {
                throw new Error("O valor do desconto não pode ser negativo.");
            }
            const invoiceAmount = data.invoiceAmount ?? existing.invoiceAmount;
            const taxAmount = payload.taxAmount ?? (data.taxPercentage !== undefined
                ? this.calculateTaxAmount(invoiceAmount, data.taxPercentage)
                : existing.taxAmount);
            const discountAmount = data.discountAmount ?? 0;
            if (taxAmount + discountAmount > invoiceAmount) {
                throw new Error("Imposto e desconto combinados não podem exceder o valor da nota.");
            }
            payload.discountAmount = discountAmount;
        }

        if (data.expectedPaymentMonth !== undefined) {
            if (!this.validateMonth(data.expectedPaymentMonth)) {
                throw new Error("O mês de previsão de pagamento deve estar entre 1 e 12.");
            }
        }

        if (data.expectedPaymentYear !== undefined) {
            if (!this.validateYear(data.expectedPaymentYear)) {
                throw new Error("O ano de previsão de pagamento deve estar entre 2000 e 2100.");
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
                    throw new Error("A Data de Saque não pode ser uma data futura.");
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
                throw new Error("Parceiro comercial não encontrado.");
            }
            payload.commercialPartnerId = data.commercialPartnerId;
        }

        // Validar centro de custos se informado
        if (data.costCenterId !== undefined) {
            const costCenter = await Repository.findOne(CostCentersEntity, {
                id: data.costCenterId
            });
            if (!costCenter) {
                throw new Error("Centro de custo não encontrado.");
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
                    throw new Error("A data efetiva de pagamento não pode ser futura.");
                }
                payload.effectivePaymentDate = paymentDate;
            }
        }

        if (data.status !== undefined) {
            payload.status = data.status;
        }

        if (data.paidValue !== undefined) {
            if (data.paidValue !== null && data.paidValue < 0) {
                throw new Error("O valor pago não pode ser negativo.");
            }
            payload.paidValue = data.paidValue;
        }

        if (data.paymentMethod !== undefined) {
            payload.paymentMethod = data.paymentMethod;
        }

        if (data.observations !== undefined) {
            payload.observations = data.observations;
        }

        // Gravar como boolean para compatibilidade com TypeORM (@Column type: "boolean")
        if (data.tax_engine_used !== undefined) {
            payload.tax_engine_used = !!data.tax_engine_used;
        }
        if (data.tax_calc_details !== undefined) {
            payload.tax_calc_details = typeof data.tax_calc_details === 'string'
                ? data.tax_calc_details
                : data.tax_calc_details != null ? JSON.stringify(data.tax_calc_details) : null;
        }
        if (data.natureza_rendimento !== undefined) {
            payload.natureza_rendimento = data.natureza_rendimento === null || data.natureza_rendimento === "" ? null : data.natureza_rendimento;
        }
        if (data.mes_referencia_nota !== undefined) {
            payload.mes_referencia_nota = (data.mes_referencia_nota && String(data.mes_referencia_nota).trim()) || null;
        }
        if (data.invoice_cnae !== undefined) {
            payload.invoice_cnae = data.invoice_cnae === null || data.invoice_cnae === "" ? null : String(data.invoice_cnae).trim();
        }
        if (data.invoice_attachment !== undefined) {
            payload.invoice_attachment = data.invoice_attachment === null || data.invoice_attachment === "" ? null : String(data.invoice_attachment).trim();
        }

        const affected = await Repository.update(PaymentOrdersEntity, id, payload);

        // Retornar objeto para compatibilidade com o framework CMMV
        // (Repository.update retorna um numero, mas o framework espera um objeto)
        if (affected === 0) {
            return { success: false, message: 'No rows updated' };
        }

        // Buscar registro atualizado
        const updated = await Repository.findOne(PaymentOrdersEntity, { id });
        return { data: updated, success: true, affected };
    }

    /**
     * Atualizar status da ordem de pagamento
     */
    async updateStatus(
        id: string,
        status: string,
        effectivePaymentDate?: string | Date | null,
        paidValue?: number | null,
        invoiceAttachment?: string | null
    ) {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");

        const existing = await Repository.findOne(PaymentOrdersEntity, { id });
        if (!existing) {
            throw new Error("Ordem de pagamento não encontrada.");
        }

        const payload: any = {};

        if (status === "Pago") {
            if (!effectivePaymentDate) {
                throw new Error('A data efetiva de pagamento é obrigatória quando o status é "Pago".');
            }
            if (invoiceAttachment && String(invoiceAttachment).trim()) {
                payload.invoice_attachment = String(invoiceAttachment).trim();
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
                throw new Error("A data efetiva de pagamento não pode ser futura.");
            }

            payload.effectivePaymentDate = paymentDate;

            if (paidValue !== undefined && paidValue !== null) {
                if (paidValue < 0) {
                    throw new Error("O valor pago não pode ser negativo.");
                }
                payload.paidValue = paidValue;
            } else if (!existing.paidValue || existing.paidValue === 0) {
                // Se não informado, usar valor líquido convertido (em BRL) será responsabilidade de outra camada
                const netValue = this.calculateNetValue(existing.invoiceAmount, existing.taxAmount);
                payload.paidValue = netValue;
            }

            // Preencher finalizedForProfitSharingAt com a data/hora atual quando confirma o pagamento
            // Isso marca a ordem como finalizada para divisão de lucros
            // Só preencher se ainda não estiver preenchido (não sobrescrever se já foi finalizada antes)
            if (!existing.finalizedForProfitSharingAt) {
                // Normalizar data/hora atual para UTC para consistência
                const now = new Date();
                payload.finalizedForProfitSharingAt = new Date(Date.UTC(
                    now.getUTCFullYear(),
                    now.getUTCMonth(),
                    now.getUTCDate(),
                    now.getUTCHours(),
                    now.getUTCMinutes(),
                    now.getUTCSeconds(),
                    now.getUTCMilliseconds()
                ));
            }
        } else {
            // Se voltar para pendente, limpar data e valor pago
            payload.effectivePaymentDate = null;
            payload.paidValue = null;
            // Não limpar finalizedForProfitSharingAt para manter histórico de quando foi finalizada
        }

        payload.status = status;

        const affected = await Repository.update(PaymentOrdersEntity, id, payload);

        if (affected === 0) {
            return { success: false, message: 'No rows updated' };
        }

        const updated = await Repository.findOne(PaymentOrdersEntity, { id });
        return { data: updated, success: true, affected };
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
     * Retornar todas as ordens de pagamento para exportacao (formato do banco).
     * Usa limite alto explicito para evitar limite padrao do repositório.
     */
    async findAllForExport() {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        return await Repository.findAll(PaymentOrdersEntity, { limit: 1000000 });
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
        const affected = await Repository.delete(PaymentOrdersEntity, id);
        return { success: affected > 0, affected };
    }

    /**
     * Recalcular impostos de todas as ordens em aberto que usaram o motor tributario.
     * Filtra por tax_engine_used = true e status != "Pago".
     */
    async recalculateAllTaxes(): Promise<{ recalculated: number; errors: string[] }> {
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const list = await Repository.findAll(PaymentOrdersEntity, { limit: 1000000 });
        const items = Array.isArray(list?.data) ? list.data : Array.isArray(list?.items) ? list.items : Array.isArray(list) ? list : [];

        const errors: string[] = [];
        let recalculated = 0;

        for (const order of items) {
            const engineUsed = order.tax_engine_used === true || order.tax_engine_used === 1;
            const isPaid = (order.status || "").toLowerCase() === "pago";
            if (!engineUsed || isPaid) continue;

            try {
                const costCenterId = order.costCenterId || order.cost_center_id;
                const invoiceAmount = Number(order.invoiceAmount || order.invoice_amount) || 0;
                if (!costCenterId || invoiceAmount <= 0) continue;

                const referenceMonth = order.expectedPaymentMonth || order.expected_payment_month || "";
                const mesRef = order.mes_referencia_nota || order.mesReferenciaNota || undefined;
                const invoiceCnae = order.invoice_cnae || order.invoiceCnae || undefined;

                const calcResult = await this.taxCalcService.calculate({
                    costCenterId,
                    grossAmount: invoiceAmount,
                    referenceMonth,
                    orderId: order.id,
                    invoiceCnae,
                    mesReferenciaNota: mesRef
                });

                if (calcResult != null && typeof calcResult.totalDeductions === "number" && calcResult.totalDeductions >= 0) {
                    const payload: any = {
                        taxAmount: Math.round(calcResult.totalDeductions * 100) / 100,
                        tax_engine_used: true,
                        tax_calc_details: JSON.stringify(calcResult),
                        irpj_adicional_amount: this.extractIrpjAdicional(calcResult)
                    };
                    await Repository.update(PaymentOrdersEntity, order.id, payload);
                    recalculated++;
                }
            } catch (err: any) {
                errors.push(`Ordem ${order.id}: ${err?.message || String(err)}`);
            }
        }

        return { recalculated, errors };
    }

    /**
     * Extrai o valor do IRPJ Adicional do resultado do motor tributario.
     */
    private extractIrpjAdicional(calcResult: any): number {
        if (!calcResult?.deductions || !Array.isArray(calcResult.deductions)) return 0;
        const item = calcResult.deductions.find((d: any) => d.name === "IRPJ Adicional");
        return item ? Math.round((Number(item.amount) || 0) * 100) / 100 : 0;
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
            throw new Error("Ordem não encontrada.");
        }

        const discountAmount = order.discountAmount ?? 0;
        return {
            invoiceAmount: order.invoiceAmount,
            taxAmount: order.taxAmount,
            discountAmount: discountAmount,
            netAmount: order.invoiceAmount - order.taxAmount - discountAmount
        };
    }

    /**
     * Importar ordens de pagamento a partir de CSV.
     * taxAmount nao e enviado no CSV: o sistema calcula a partir do percentual (coluna opcional taxPercentage).
     * Formato: commercialPartnerId,currency,invoiceAmount,taxPercentage,discountAmount,withdrawalDate,expectedPaymentMonth,expectedPaymentYear,effectivePaymentDate,status,paidValue,paymentMethod,observations
     * costCenterId nao e enviado: o sistema usa o centro de custo cadastrado no parceiro comercial.
     * Delimitador: virgula (,) ou ponto e virgula (;) - detectado automaticamente. Valores decimais com ponto. Datas YYYY-MM-DD.
     */
    async importFromCSV(csvContent: string): Promise<{
        data: {
            imported: number;
            errors: string[];
        }
    }> {
        const errors: string[] = [];
        let imported = 0;

        interface CSVRow {
            commercialPartnerId?: string;
            currency?: string;
            invoiceAmount?: string;
            taxPercentage?: string;
            discountAmount?: string;
            withdrawalDate?: string;
            expectedPaymentMonth?: string;
            expectedPaymentYear?: string;
            effectivePaymentDate?: string;
            status?: string;
            paidValue?: string;
            paymentMethod?: string;
            observations?: string;
        }

        let records: CSVRow[];
        const firstLine = csvContent.split(/\r?\n/)[0] || "";
        const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
        try {
            records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true,
                delimiter
            });
        } catch (parseError: any) {
            return {
                data: {
                    imported: 0,
                    errors: ["Erro ao ler CSV: " + (parseError?.message || String(parseError))]
                }
            };
        }

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2; // 1-based + header

            const commercialPartnerId = row.commercialPartnerId?.trim();
            const currency = (row.currency?.trim() || "BRL").toUpperCase();
            const invoiceAmount = parseFloat(row.invoiceAmount?.replace(",", ".") || "0");
            const taxPercentage = parseFloat(row.taxPercentage?.replace(",", ".") || "0");
            const discountAmount = parseFloat(row.discountAmount?.replace(",", ".") || "0");
            const withdrawalDate = row.withdrawalDate?.trim() || "";
            const expectedPaymentMonth = parseInt(row.expectedPaymentMonth?.trim() || "1", 10);
            const expectedPaymentYear = parseInt(row.expectedPaymentYear?.trim() || String(new Date().getFullYear()), 10);
            const effectivePaymentDate = row.effectivePaymentDate?.trim() || null;
            const status = (row.status?.trim() || "Pendente") === "Pago" ? "Pago" : "Pendente";
            const paidValue = row.paidValue?.trim() ? parseFloat(row.paidValue.replace(",", ".")) : null;
            const paymentMethod = row.paymentMethod?.trim() || null;
            const observations = row.observations?.trim() || null;

            if (!commercialPartnerId) {
                errors.push(`Linha ${rowNum}: commercialPartnerId e obrigatorio`);
                continue;
            }

            const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
            const partner = await Repository.findOne(CommercialPartnersEntity, { id: commercialPartnerId });
            if (!partner) {
                errors.push(`Linha ${rowNum}: parceiro comercial nao encontrado`);
                continue;
            }
            const costCenterId = (partner as any).costCenterId;
            if (!costCenterId) {
                errors.push(`Linha ${rowNum}: parceiro sem centro de custo cadastrado`);
                continue;
            }
            if (!withdrawalDate || !/^\d{4}-\d{2}-\d{2}$/.test(withdrawalDate)) {
                errors.push(`Linha ${rowNum}: withdrawalDate deve estar no formato YYYY-MM-DD`);
                continue;
            }
            if (status === "Pago" && !effectivePaymentDate) {
                errors.push(`Linha ${rowNum}: effectivePaymentDate e obrigatorio quando status e Pago`);
                continue;
            }

            try {
                await this.create({
                    commercialPartnerId,
                    costCenterId,
                    currency,
                    invoiceAmount,
                    taxPercentage,
                    discountAmount: discountAmount || 0,
                    withdrawalDate,
                    expectedPaymentMonth,
                    expectedPaymentYear,
                    effectivePaymentDate: effectivePaymentDate || undefined,
                    status,
                    paidValue: paidValue ?? undefined,
                    paymentMethod: paymentMethod ?? undefined,
                    observations: observations ?? undefined
                });
                imported++;
            } catch (err: any) {
                errors.push(`Linha ${rowNum}: ${err?.message || String(err)}`);
            }
        }

        return { data: { imported, errors } };
    }

    /**
     * Atualizar ordens em lote a partir de CSV no mesmo formato do export (formato do banco).
     * Colunas: id, commercialPartnerId, currency, costCenterId, invoiceAmount, taxAmount, discountAmount,
     * withdrawalDate, expectedPaymentMonth, effectivePaymentDate, paidValue, status, paymentMethod,
     * observations, finalizedForProfitSharingAt. id e obrigatorio para identificar o registro.
     * Delimitador: virgula ou ponto e virgula. Datas em ISO (YYYY-MM-DD ou ISO completo).
     */
    async updateFromExportCSV(csvContent: string): Promise<{
        data: { updated: number; errors: string[] };
    }> {
        const errors: string[] = [];
        let updated = 0;
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
        const CostCentersEntity = Repository.getEntity("SasCostCentersEntity");

        const firstLine = csvContent.split(/\r?\n/)[0] || "";
        const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
        let records: Record<string, string>[];
        try {
            records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true,
                delimiter
            });
        } catch (parseError: any) {
            return {
                data: {
                    updated: 0,
                    errors: ["Erro ao ler CSV: " + (parseError?.message || String(parseError))]
                }
            };
        }

        const parseOptionalDate = (val: string | null | undefined): Date | null => {
            const s = val?.trim();
            if (!s) return null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                const [y, m, d] = s.split("-").map(Number);
                return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
            }
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d;
        };

        const parseOptionalNumber = (val: string | null | undefined): number | null => {
            const s = val?.trim();
            if (s === "" || s === null || s === undefined) return null;
            const n = parseFloat(s.replace(",", "."));
            return isNaN(n) ? null : n;
        };

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2;
            const id = row.id?.trim();
            if (!id) {
                errors.push(`Linha ${rowNum}: id e obrigatorio`);
                continue;
            }

            const existing = await Repository.findOne(PaymentOrdersEntity, { id });
            if (!existing) {
                errors.push(`Linha ${rowNum}: ordem nao encontrada (id=${id})`);
                continue;
            }

            const payload: any = {};

            if (row.commercialPartnerId !== undefined && row.commercialPartnerId !== "") {
                const partner = await Repository.findOne(CommercialPartnersEntity, { id: row.commercialPartnerId.trim() });
                if (!partner) {
                    errors.push(`Linha ${rowNum}: parceiro comercial nao encontrado`);
                    continue;
                }
                payload.commercialPartnerId = row.commercialPartnerId.trim();
            }
            if (row.costCenterId !== undefined && row.costCenterId !== "") {
                const cc = await Repository.findOne(CostCentersEntity, { id: row.costCenterId.trim() });
                if (!cc) {
                    errors.push(`Linha ${rowNum}: centro de custo nao encontrado`);
                    continue;
                }
                payload.costCenterId = row.costCenterId.trim();
            }
            if (row.currency !== undefined && row.currency !== "") payload.currency = row.currency.trim().toUpperCase();
            if (row.invoiceAmount !== undefined && row.invoiceAmount !== "") {
                const v = parseOptionalNumber(row.invoiceAmount);
                if (v !== null && v >= 0) payload.invoiceAmount = v;
            }
            if (row.taxAmount !== undefined && row.taxAmount !== "") {
                const v = parseOptionalNumber(row.taxAmount);
                if (v !== null && v >= 0) payload.taxAmount = v;
            }
            if (row.discountAmount !== undefined && row.discountAmount !== "") {
                const v = parseOptionalNumber(row.discountAmount);
                if (v !== null && v >= 0) payload.discountAmount = v;
            }
            if (row.withdrawalDate !== undefined && row.withdrawalDate !== "") {
                const d = parseOptionalDate(row.withdrawalDate);
                if (d) payload.withdrawalDate = d;
            }
            if (row.expectedPaymentMonth !== undefined && row.expectedPaymentMonth !== "") {
                const s = row.expectedPaymentMonth.trim();
                if (/^\d{4}-\d{2}$/.test(s)) payload.expectedPaymentMonth = s;
            }
            if (row.effectivePaymentDate !== undefined) {
                payload.effectivePaymentDate = parseOptionalDate(row.effectivePaymentDate);
            }
            if (row.paidValue !== undefined) {
                const v = parseOptionalNumber(row.paidValue);
                payload.paidValue = v;
            }
            if (row.status !== undefined && row.status !== "") payload.status = row.status.trim();
            if (row.paymentMethod !== undefined) payload.paymentMethod = row.paymentMethod.trim() || null;
            if (row.observations !== undefined) payload.observations = row.observations.trim() || null;
            if (row.finalizedForProfitSharingAt !== undefined) {
                payload.finalizedForProfitSharingAt = parseOptionalDate(row.finalizedForProfitSharingAt);
            }

            try {
                await Repository.update(PaymentOrdersEntity, id, payload);
                updated++;
            } catch (err: any) {
                errors.push(`Linha ${rowNum}: ${err?.message || String(err)}`);
            }
        }

        return { data: { updated, errors } };
    }
}



