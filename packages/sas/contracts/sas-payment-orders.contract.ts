import "reflect-metadata";
import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasPaymentOrders',
    controllerCustomPath: 'affiliation-manager/payment-orders',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_payment_orders",
        databaseTimestamps: true
    }
})
export class SasPaymentOrdersContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    commercialPartnerId!: string; // ID do Parceiro Comercial

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    currency!: string; // USD, EUR, BRL

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    costCenterId!: string; // ID da Empresa de Recebimento

    @ContractField({
        protoType: 'double',
        nullable: false,
        index: true,
    })
    invoiceAmount!: number; // Valor Emitido na Nota/Fatura

    @ContractField({
        protoType: 'double',
        nullable: false,
        defaultValue: 0,
        index: true,
    })
    taxAmount!: number; // Valor do Imposto

    @ContractField({
        protoType: 'double',
        nullable: false,
        defaultValue: 0,
        index: true,
    })
    discountAmount!: number; // Valor de Desconto

    @ContractField({
        protoType: 'date',
        nullable: false,
        index: true,
    })
    withdrawalDate!: Date; // Data do Saque/Recebimento na Plataforma Parceira

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    expectedPaymentMonth!: string; // Mês/Ano de Previsão do Pagamento (formato: YYYY-MM)

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    effectivePaymentDate?: Date; // Data Efetiva do Pagamento

    @ContractField({
        protoType: 'double',
        nullable: true,
        index: true,
    })
    paidValue?: number; // Valor efetivamente pago (sempre em BRL)

    @ContractField({
        protoType: 'string',
        nullable: false,
        defaultValue: 'Pendente',
        index: true,
    })
    status!: string; // Pendente, Pago, Em litígio

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    paymentMethod?: string; // Método de pagamento selecionado (ex: "Wise: email@exemplo.com")

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: false,
    })
    observations?: string; // Observações sobre a ordem de pagamento

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true,
    })
    finalizedForProfitSharingAt?: Date; // Data/hora em que foi finalizada para divisão de lucros (preenchido automaticamente ao confirmar pagamento)

    @ContractField({ protoType: 'string', nullable: true, index: true })
    natureza_rendimento?: string; // Codigo Reinf (ex: 13001 servicos TI)

    @ContractField({ protoType: 'string', nullable: true, index: true })
    mes_referencia_nota?: string; // Mes de referencia da nota (YYYY-MM) - competencia para IRPJ

    @ContractField({ protoType: 'string', nullable: true, index: true })
    id_imposto_reforma?: string; // Preparacao split payment IBS/CBS

    @ContractField({ protoType: 'boolean', nullable: true, defaultValue: false, index: true })
    tax_engine_used?: boolean; // true se o imposto foi calculado pelo motor tributario

    @ContractField({ protoType: 'string', nullable: true, index: false })
    tax_calc_details?: string; // JSON com o detalhamento do calculo do motor tributario (deductions, gross, liquid, totalDeductions)

    @ContractField({ protoType: 'string', nullable: true, index: true })
    invoice_cnae?: string; // CNAE da nota (codigo da tabela sas_simples_nacional_cnae). Default: CNAE principal do centro de custo.

    @ContractField({ protoType: 'string', nullable: true, index: false })
    invoice_attachment?: string; // URL do PDF da nota fiscal (obrigatorio ao marcar como Pago).

    @ContractField({ protoType: 'double', nullable: true, defaultValue: 0, index: false })
    irpj_adicional_amount?: number; // Valor do IRPJ adicional calculado para esta nota (0 se nao incide)
}



