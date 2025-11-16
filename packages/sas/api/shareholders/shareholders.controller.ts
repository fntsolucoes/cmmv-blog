import {
    Controller, Get
} from "@cmmv/http";

import {
    ShareholdersService
} from "./shareholders.service";

@Controller("sas/shareholders")
export class ShareholdersController {
    constructor(private readonly shareholdersService: ShareholdersService){}

    @Get("validate-percentages")
    async validatePercentages() {
        return await this.shareholdersService.validatePercentages();
    }
}

