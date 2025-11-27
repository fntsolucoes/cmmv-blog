import {
    Service, Logger
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import {
    ScriptSettingsService
} from "../script-settings/script-settings.service";

@Service()
export class SasTagsCustomService {
    private readonly logger = new Logger("SasTagsCustomService");

    constructor(private readonly scriptSettingsService: ScriptSettingsService) {}

    /**
     * Cria uma nova tag e, se houver campanha vinculada,
     * atualiza o campo "script" da campanha com o script gerado.
     */
    async createTagAndAttachToCampaign(body: any) {
        try {
            const TagsEntity = Repository.getEntity("SasTagsEntity");
            const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");

            // Criar a tag normalmente
            const inserted = await Repository.insert(TagsEntity, body);

            // Descobrir a campanha vinculada (primeiro ID da lista)
            const rawCampaignIds = body?.campaignIds;
            let campaignId: string | null = null;

            if (rawCampaignIds) {
                try {
                    const parsed = typeof rawCampaignIds === 'string'
                        ? JSON.parse(rawCampaignIds)
                        : rawCampaignIds;

                    if (Array.isArray(parsed) && parsed.length > 0) {
                        campaignId = parsed[0];
                    }
                } catch (parseError: any) {
                    this.logger.error('Erro ao parsear campaignIds da tag criada:', parseError);
                }
            }

            // Se tiver campanha e script gerado, atualizar a campanha
            if (campaignId && body?.generatedScript) {
                await Repository.update(CampaignsEntity, { id: campaignId }, {
                    script: body.generatedScript
                });

                this.logger.log(
                    `Script da campanha ${campaignId} atualizado a partir da criação da tag`
                );
            }

            return inserted;
        } catch (error: any) {
            this.logger.error('Erro ao criar tag e atrelar script à campanha:', error);
            throw error;
        }
    }

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

    /**
     * Gera o script baseado no modelo de script e código sequencial
     * @param scriptSettingId - ID do modelo de script
     * @returns Objeto com o script gerado e o código usado
     */
    async generateScript(scriptSettingId: string): Promise<{ script: string; code: string }> {
        try {
            const ScriptSettingsEntity = Repository.getEntity("SasScriptSettingsEntity");
            const setting = await Repository.findOne(ScriptSettingsEntity, { id: scriptSettingId }, []);

            if (!setting) {
                throw new Error(`Modelo de script com ID ${scriptSettingId} não encontrado`);
            }

            // Gerar o próximo código sequencial
            const generatedCode = await this.scriptSettingsService.generateNextCode(scriptSettingId);

            // Montar a URL completa
            const scriptUrl = `${setting.defaultRoute}${generatedCode}.js`;

            // Gerar o script no formato especificado
            const generatedScript = `<script>
(function () {
      var script = document.createElement('script'),
          head   = document.getElementsByTagName('head')[0];

      script.async = 1;
      script.type  = 'text/javascript';
      script.src   = '${scriptUrl}';

      head.appendChild(script);
})();
</script>`;

            this.logger.log(`Script gerado para modelo ${scriptSettingId}: ${generatedCode}`);
            
            return {
                script: generatedScript,
                code: generatedCode
            };
        } catch (error: any) {
            this.logger.error(`Erro ao gerar script para modelo ${scriptSettingId}:`, error);
            throw error;
        }
    }
}

