import { Controller, Get, Post, Put, Delete, Queries, Body, Param } from "@cmmv/http";
import { Repository } from "@cmmv/repository";

function toCnaeId(code: string): string {
    const normalized = (code || "").trim().replace(/\//g, "-").replace(/\s/g, "");
    return normalized ? `cnae-${normalized}` : `cnae-${Date.now()}`;
}

@Controller("affiliation-manager/simples-nacional-cnae")
export class SimplesNacionalCnaeController {
    @Get("")
    async getAll(@Queries() queries: Record<string, string> = {}) {
        const Entity = Repository.getEntity("SasSimplesNacionalCnaeEntity");
        return await Repository.findAll(Entity, queries || {}, []);
    }

    @Get(":id")
    async getById(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasSimplesNacionalCnaeEntity");
        return await Repository.findOne(Entity, { id });
    }

    @Post("")
    async create(@Body() body: any) {
        const Entity = Repository.getEntity("SasSimplesNacionalCnaeEntity");
        const id = body.id || toCnaeId(body.code);
        const payload = {
            ...body,
            id,
            fator_r: body.fator_r === true || body.fator_r === 1 ? 1 : 0
        };
        return await Repository.insert(Entity, payload);
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        const Entity = Repository.getEntity("SasSimplesNacionalCnaeEntity");
        const payload = { ...body };
        if (typeof payload.fator_r === "boolean") payload.fator_r = payload.fator_r ? 1 : 0;
        return await Repository.update(Entity, { id }, payload);
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasSimplesNacionalCnaeEntity");
        return await Repository.delete(Entity, { id });
    }
}
