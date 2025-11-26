import {
    Controller, Get
} from "@cmmv/http";

import {
    TagsService
} from "./tags.service";

@Controller("affiliation-manager/tags")
export class TagsController {
    constructor(private readonly tagsService: TagsService){}

    @Get("all")
    async getAllTags() {
        return await this.tagsService.getAllTags();
    }
}

