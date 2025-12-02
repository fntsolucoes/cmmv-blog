import {
    Service, Logger
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class ScriptSettingsService {
    private readonly logger = new Logger("ScriptSettingsService");

    async getAllScriptSettings() {
        try {
            const ScriptSettingsEntity = Repository.getEntity("SasScriptSettingsEntity");
            const result = await Repository.findAll(ScriptSettingsEntity, {
                limit: 1000  // Limite máximo permitido pelo repositório
            }, []);
            return {
                data: result?.data || [],
                total: result?.total || 0
            };
        } catch (error: any) {
            this.logger.error('Erro ao buscar todas as configurações de script:', error);
            throw error;
        }
    }

    /**
     * Gera o próximo código sequencial baseado no código de partida
     * @param scriptSettingId - ID da configuração de script
     * @returns Próximo código sequencial
     */
    async generateNextCode(scriptSettingId: string): Promise<string> {
        try {
            const ScriptSettingsEntity = Repository.getEntity("SasScriptSettingsEntity");
            const setting = await Repository.findOne(ScriptSettingsEntity, { id: scriptSettingId });

            if (!setting) {
                throw new Error(`Configuração de script com ID ${scriptSettingId} não encontrada`);
            }

            // Incrementar o contador sequencial (offset em relação ao código base)
            // Garantir que o valor seja numérico (o repositório pode devolver string)
            const currentSequenceNumber = Number(setting.currentSequence ?? 0) || 0;
            const nextSequence = currentSequenceNumber + 1;

            // Gerar o código baseado no código de partida + sequencial
            // Exemplo: startCode = "adp15a98123453500"
            // - dígitos finais: "98123453500"  (baseNum)
            // - sequência 1    -> "98123453501"
            const baseCode = setting.startCode;

            // Encontrar os últimos dígitos numéricos no código base
            const match = baseCode.match(/(\d+)$/);
            if (!match) {
                throw new Error(`Código de partida "${baseCode}" não contém dígitos numéricos no final`);
            }

            const lastDigits = match[1];
            const digitCount = lastDigits.length;

            // Número base a partir do código inicial
            const baseNumber = parseInt(lastDigits, 10);
            if (Number.isNaN(baseNumber)) {
                throw new Error(`Não foi possível converter os dígitos finais de "${baseCode}" em número`);
            }

            // Novo número = número base + sequência
            const newNumericValue = baseNumber + nextSequence;

            // Mantém o mesmo tamanho de dígitos, preenchendo com zeros à esquerda se necessário
            const finalNumber = newNumericValue.toString().padStart(digitCount, '0');

            // Substituir os últimos dígitos do código base pelo novo número
            const nextCode = baseCode.replace(/\d+$/, finalNumber);
            
            // Atualizar o contador no banco
            await Repository.update(ScriptSettingsEntity, { id: scriptSettingId }, { 
                currentSequence: nextSequence 
            });

            this.logger.log(`Código gerado para script ${scriptSettingId}: ${nextCode} (sequência: ${nextSequence})`);
            
            return nextCode;
        } catch (error: any) {
            this.logger.error(`Erro ao gerar próximo código para script ${scriptSettingId}:`, error);
            throw error;
        }
    }
}

