import {
    Controller, Get, Post, Param
} from "@cmmv/http";

import {
    ScriptSettingsService
} from "./script-settings.service";

@Controller("affiliation-manager/script-settings")
export class ScriptSettingsController {
    constructor(private readonly scriptSettingsService: ScriptSettingsService){}

    @Get("all")
    async getAllScriptSettings() {
        return await this.scriptSettingsService.getAllScriptSettings();
    }

    @Post(":id/generate-next-code")
    async generateNextCode(@Param("id") id: string) {
        const nextCode = await this.scriptSettingsService.generateNextCode(id);
        return { nextCode };
    }
}

