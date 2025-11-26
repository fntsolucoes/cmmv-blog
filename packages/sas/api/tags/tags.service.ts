import {
    Service, Logger
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class TagsService {
    private readonly logger = new Logger("TagsService");

    async getAllTags() {
        try {
            const TagsEntity = Repository.getEntity("SasTagsEntity");
            const result = await Repository.findAll(TagsEntity, {}, [], { limit: 10000 });
            return {
                data: result?.data || [],
                total: result?.total || 0
            };
        } catch (error: any) {
            this.logger.error('Erro ao buscar todas as tags:', error);
            throw error;
        }
    }
}

