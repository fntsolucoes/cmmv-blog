import {
    Controller, Get, Post, Put, Delete, Param, Body
} from "@cmmv/http";

import {
    Repository
} from "@cmmv/repository";

import {
    TicketPartnersService
} from "./ticket-partners.service";

@Controller("sas/ticket-partners")
export class TicketPartnersController {
    constructor(private readonly ticketPartnersService: TicketPartnersService){}

    @Get("all")
    async getAllPartners() {
        return await this.ticketPartnersService.getAllPartners();
    }

    @Get("all-including-inactive")
    async getAllPartnersIncludingInactive() {
        return await this.ticketPartnersService.getAllPartnersIncludingInactive();
    }

    @Get("default")
    async getDefaultPartner() {
        return await this.ticketPartnersService.getDefaultPartner();
    }

    @Get(":id")
    async getPartnerById(@Param("id") id: string) {
        return await this.ticketPartnersService.getPartnerById(id);
    }

    @Post("")
    async insert(@Body() data: any) {
        const TicketPartnersEntity = Repository.getEntity("SasTicketPartnersEntity");
        
        // Se está marcando como padrão, desmarcar os outros
        if (data.isDefault) {
            const allPartners = await Repository.findAll(TicketPartnersEntity, { isDefault: true });
            if (allPartners?.data && allPartners.data.length > 0) {
                for (const partner of allPartners.data) {
                    await Repository.update(TicketPartnersEntity, { id: partner.id }, { isDefault: false });
                }
            }
        }
        
        return await Repository.insert(TicketPartnersEntity, data);
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() data: any) {
        const TicketPartnersEntity = Repository.getEntity("SasTicketPartnersEntity");
        
        // Se está marcando como padrão, desmarcar os outros
        if (data.isDefault) {
            const allPartners = await Repository.findAll(TicketPartnersEntity, { isDefault: true });
            if (allPartners?.data && allPartners.data.length > 0) {
                for (const partner of allPartners.data) {
                    if (partner.id !== id) {
                        await Repository.update(TicketPartnersEntity, { id: partner.id }, { isDefault: false });
                    }
                }
            }
        }
        
        return await Repository.update(TicketPartnersEntity, { id }, data);
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        const TicketPartnersEntity = Repository.getEntity("SasTicketPartnersEntity");
        return await Repository.delete(TicketPartnersEntity, { id });
    }
}

