import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasPaymentOrders',
    controllerCustomPath: 'sas/payment-orders',
    protoPackage: 'sas',
    subPath: '/sas',
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
    status!: string; // Pendente, Pago

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
}



