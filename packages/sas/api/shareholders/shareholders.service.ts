import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class ShareholdersService {
    /**
     * Validar se a soma das porcentagens não excede 100%
     */
    async validatePercentages() {
        const ShareholdersEntity = Repository.getEntity("SasShareholdersEntity");
        const shareholders = await Repository.findAll(ShareholdersEntity, {
            where: { active: true },
            limit: 1000
        });

        const totalPercentage = shareholders.data.reduce((sum: number, sh: any) => sum + sh.percentage, 0);
        
        return {
            totalPercentage,
            isValid: totalPercentage <= 100,
            shareholders: shareholders.data
        };
    }
}

