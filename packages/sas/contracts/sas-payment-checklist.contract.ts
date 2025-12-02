import "reflect-metadata";
import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasPaymentChecklist',
    controllerCustomPath: 'affiliation-manager/payment-checklist',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: false,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_payment_checklist",
        databaseTimestamps: true
    },
    index: [
        {
            name: 'partner_month_unique',
            fields: ['commercialPartnerId', 'year', 'month'],
            options: {
                unique: true
            }
        }
    ]
})
export class SasPaymentChecklistContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    commercialPartnerId!: string; // ID do Parceiro Comercial

    @ContractField({
        protoType: 'integer',
        nullable: false,
        index: true,
    })
    year!: number; // Ano (ex: 2025)

    @ContractField({
        protoType: 'integer',
        nullable: false,
        index: true,
    })
    month!: number; // Mês (1-12)

    @ContractField({
        protoType: 'double',
        nullable: true,
        defaultValue: 0,
    })
    capturedValue?: number; // Valor Captado

    @ContractField({
        protoType: 'double',
        nullable: true,
        defaultValue: 0,
    })
    validatedValue?: number; // Valor Validado

    @ContractField({
        protoType: 'double',
        nullable: true,
        defaultValue: 0,
    })
    rejectedValue?: number; // Valor Recusado

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true,
    })
    invoiceIssued!: boolean; // Nota Emitida (flag)

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    paymentOrderId?: string; // ID da Ordem de Pagamento anexada (opcional)
}

