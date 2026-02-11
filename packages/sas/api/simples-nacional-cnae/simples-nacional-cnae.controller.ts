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
        try {
            const Entity = Repository.getEntity("SasSimplesNacionalCnaeEntity");
            const fatorR = body.fator_r === true || body.fator_r === 1 || body.fator_r === "1";
            const payload = {
                code: body.code,
                denominacao: body.denominacao,
                annex_code: body.annex_code ?? null,
                fator_r: fatorR
            };
            const ok = await Repository.updateById(Entity, id, payload);
            if (!ok) return { success: false, affected: 0 };
            return await Repository.findOne(Entity, { id });
        } catch (err: any) {
            const msg = err?.message || String(err);
            if (msg.includes("no such column") && msg.includes("fator_r")) {
                throw new Error("Coluna fator_r nao existe na tabela. Execute a migracao add-simples-nacional-cnae-fator-r.sql.");
            }
            throw err;
        }
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        const Entity = Repository.getEntity("SasSimplesNacionalCnaeEntity");
        return await Repository.delete(Entity, id);
    }
}
