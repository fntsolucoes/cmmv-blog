import "reflect-metadata";
import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Sas',
    controllerName: 'SasTicketAttachments',
    controllerCustomPath: 'affiliation-manager/ticket-attachments',
    protoPackage: 'sas',
    subPath: '/affiliation-manager',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "sas_ticket_attachments",
        databaseTimestamps: true
    }
})
export class SasTicketAttachmentsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    ticketId!: string; // ID do ticket

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    commentId?: string; // ID do comentário (se anexado a um comentário)

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: false,
    })
    fileName!: string; // Nome do arquivo

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: false,
    })
    filePath!: string; // Caminho do arquivo armazenado

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: false,
    })
    fileType!: string; // Tipo MIME do arquivo

    @ContractField({
        protoType: 'integer',
        nullable: false,
        index: false,
    })
    fileSize!: number; // Tamanho do arquivo em bytes

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    uploadedBy!: string; // ID do usuário que fez upload
}

