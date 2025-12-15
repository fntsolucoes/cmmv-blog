import {
    Service, Logger, Cron
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import * as fs from "fs";
import * as path from "path";

import {
    ScriptSettingsService
} from "../script-settings/script-settings.service";

@Service()
export class SasTagsCustomService {
    private readonly logger = new Logger("SasTagsCustomService");
    private readonly timeout = 30000; // 30s para validação de página
    private proxies: string[] | null = null;

    constructor(private readonly scriptSettingsService: ScriptSettingsService) {}

    /**
     * Verifica se o schema do banco está correto
     * Retorna true se todas as colunas necessárias existem
     */
    private async verifyDatabaseSchema(): Promise<boolean> {
        try {
            const TagsEntity = Repository.getEntity("SasTagsEntity");
            
            // Tentar buscar uma tag vazia para verificar se o schema está OK
            const testResult = await Repository.findAll(TagsEntity, {}, [], { take: 1 });
            
            // Se conseguir buscar sem erro, o schema provavelmente está OK
            return true;
        } catch (error: any) {
            // Se der erro de coluna não encontrada, o schema está desatualizado
            if (error?.message?.includes('no such column') || 
                error?.message?.includes('SQLITE_ERROR') ||
                error?.code === 'SQLITE_ERROR') {
                this.logger.error(`[verifyDatabaseSchema] ⚠️ Schema do banco desatualizado!`);
                this.logger.error(`[verifyDatabaseSchema] Erro: ${error.message}`);
                return false;
            }
            // Outros erros podem ser normais (ex: tabela vazia)
            return true;
        }
    }

    /**
     * Cria uma nova tag e, se houver campanha vinculada,
     * atualiza o campo "script" da campanha com o script gerado.
     */
    async createTagAndAttachToCampaign(body: any) {
        try {
            // Verificar schema antes de inserir
            const schemaOk = await this.verifyDatabaseSchema();
            if (!schemaOk) {
                this.logger.error(`[createTagAndAttachToCampaign] ⚠️ Schema do banco desatualizado. Execute as migrações SQL antes de continuar.`);
            }
            
            const TagsEntity = Repository.getEntity("SasTagsEntity");
            const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");

            // Garantir que novas tags comecem com status "Não verificada"
            if (!body.scriptStatus) {
                body.scriptStatus = "Não verificada";
            }

            // Garantir que campos obrigatórios estejam presentes
            if (body.active === undefined || body.active === null) {
                body.active = true;
            }

            // Garantir que name seja uma string vazia se não fornecido (evita problemas com NOT NULL)
            if (body.name === undefined || body.name === null) {
                body.name = '';
            }

            // Criar objeto de dados explícito para garantir que todos os campos sejam preservados
            // IMPORTANTE: Preservar valores exatamente como vêm, apenas substituindo undefined por null
            const dataToInsert: any = {};

            // Copiar todos os campos do body, preservando null mas convertendo undefined para null
            dataToInsert.name = body.name !== undefined ? body.name : '';
            dataToInsert.description = body.description !== undefined ? body.description : null;
            dataToInsert.scriptSettingId = body.scriptSettingId !== undefined ? body.scriptSettingId : null;
            dataToInsert.campaignIds = body.campaignIds !== undefined ? body.campaignIds : null;
            dataToInsert.generatedScript = body.generatedScript !== undefined ? body.generatedScript : null;
            dataToInsert.generatedCode = body.generatedCode !== undefined ? body.generatedCode : null;
            dataToInsert.sellerUrl = body.sellerUrl !== undefined ? body.sellerUrl : null;
            dataToInsert.active = body.active !== undefined && body.active !== null ? body.active : true;
            dataToInsert.scriptStatus = body.scriptStatus !== undefined ? body.scriptStatus : 'Não verificada';
            
            // Log detalhado ANTES da inserção para debug
            this.logger.log(`[createTagAndAttachToCampaign] ⚠️ DEBUG: Valores exatos que serão inseridos:`, {
                'scriptSettingId (tipo)': typeof dataToInsert.scriptSettingId,
                'scriptSettingId (valor)': dataToInsert.scriptSettingId,
                'campaignIds (tipo)': typeof dataToInsert.campaignIds,
                'campaignIds (valor)': dataToInsert.campaignIds,
                'generatedCode (tipo)': typeof dataToInsert.generatedCode,
                'generatedCode (valor)': dataToInsert.generatedCode,
                'sellerUrl (tipo)': typeof dataToInsert.sellerUrl,
                'sellerUrl (valor)': dataToInsert.sellerUrl,
                'generatedScript (presente)': !!dataToInsert.generatedScript,
                'generatedScript (tamanho)': dataToInsert.generatedScript ? dataToInsert.generatedScript.length : 0
            });

            // Log dos dados que serão inseridos
            this.logger.log(`[createTagAndAttachToCampaign] Dados recebidos para inserção:`, {
                name: dataToInsert.name,
                description: dataToInsert.description,
                scriptSettingId: dataToInsert.scriptSettingId,
                campaignIds: dataToInsert.campaignIds,
                generatedScript: dataToInsert.generatedScript ? `${dataToInsert.generatedScript.substring(0, 100)}...` : null,
                generatedCode: dataToInsert.generatedCode,
                sellerUrl: dataToInsert.sellerUrl,
                active: dataToInsert.active,
                scriptStatus: dataToInsert.scriptStatus
            });

            // Criar a tag normalmente usando dataToInsert ao invés de body
            let inserted;
            try {
                // Log do objeto completo antes de inserir
                this.logger.log(`[createTagAndAttachToCampaign] ⚠️ OBJETO COMPLETO dataToInsert:`, JSON.stringify(dataToInsert, null, 2));
                
                inserted = await Repository.insert(TagsEntity, dataToInsert);
                
                // Log do resultado da inserção
                this.logger.log(`[createTagAndAttachToCampaign] ⚠️ RESULTADO DA INSERÇÃO:`, JSON.stringify(inserted, null, 2));
                
                // Verificar se a inserção retornou erro
                if (inserted && typeof inserted === 'object' && 'success' in inserted && inserted.success === false) {
                    const errorMessage = (inserted as any).message || 'Erro desconhecido ao inserir tag';
                    this.logger.error(`[createTagAndAttachToCampaign] ❌ Erro na inserção: ${errorMessage}`);
                    throw new Error(errorMessage);
                }
                
                // Se inserted for um objeto com data, usar data
                const insertedData = (inserted as any)?.data || inserted;
                const insertedId = insertedData?.id || inserted?.id;
                
                this.logger.log(`[createTagAndAttachToCampaign] Tag inserida com sucesso. ID: ${insertedId || 'N/A'}`);
                
                // Verificar se a tag foi realmente inserida fazendo uma busca
                if (insertedId) {
                    // Aguardar um pouco para garantir que a transação foi commitada
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const verify = await Repository.findOne(TagsEntity, { id: insertedId });
                    if (!verify) {
                        this.logger.error(`[createTagAndAttachToCampaign] ⚠️ ATENÇÃO: Tag inserida mas não encontrada no banco! ID: ${insertedId}`);
                        this.logger.error(`[createTagAndAttachToCampaign] Isso pode indicar um problema com transações ou sincronização do schema.`);
                    } else {
                        // Verificar se todos os campos importantes foram salvos
                        const missingFields: string[] = [];
                        if (!verify.scriptSettingId && dataToInsert.scriptSettingId) missingFields.push('scriptSettingId');
                        if (!verify.campaignIds && dataToInsert.campaignIds) missingFields.push('campaignIds');
                        if (!verify.generatedScript && dataToInsert.generatedScript) missingFields.push('generatedScript');
                        if (!verify.generatedCode && dataToInsert.generatedCode) missingFields.push('generatedCode');
                        if (!verify.sellerUrl && dataToInsert.sellerUrl) missingFields.push('sellerUrl');
                        
                        if (missingFields.length > 0) {
                            this.logger.error(`[createTagAndAttachToCampaign] ⚠️ ATENÇÃO: Campos não foram salvos: ${missingFields.join(', ')}`);
                            this.logger.error(`[createTagAndAttachToCampaign] Dados enviados:`, {
                                scriptSettingId: dataToInsert.scriptSettingId,
                                campaignIds: dataToInsert.campaignIds,
                                generatedScript: dataToInsert.generatedScript ? 'presente' : 'ausente',
                                generatedCode: dataToInsert.generatedCode,
                                sellerUrl: dataToInsert.sellerUrl
                            });
                            this.logger.error(`[createTagAndAttachToCampaign] Dados salvos:`, {
                                scriptSettingId: verify.scriptSettingId,
                                campaignIds: verify.campaignIds,
                                generatedScript: verify.generatedScript ? 'presente' : 'ausente',
                                generatedCode: verify.generatedCode,
                                sellerUrl: verify.sellerUrl
                            });
                            
                            // FORÇAR atualização dos campos faltantes imediatamente
                            this.logger.log(`[createTagAndAttachToCampaign] ⚠️ FORÇANDO atualização dos campos faltantes...`);
                            try {
                                const updateData: any = {};
                                
                                // Forçar todos os campos críticos, mesmo que sejam null
                                updateData.scriptSettingId = dataToInsert.scriptSettingId;
                                updateData.campaignIds = dataToInsert.campaignIds;
                                updateData.generatedScript = dataToInsert.generatedScript;
                                updateData.generatedCode = dataToInsert.generatedCode;
                                updateData.sellerUrl = dataToInsert.sellerUrl;

                                this.logger.log(`[createTagAndAttachToCampaign] ⚠️ Dados para atualização forçada:`, {
                                    scriptSettingId: updateData.scriptSettingId,
                                    campaignIds: updateData.campaignIds,
                                    generatedCode: updateData.generatedCode,
                                    sellerUrl: updateData.sellerUrl,
                                    generatedScript: updateData.generatedScript ? 'presente' : 'null'
                                });
                                
                                const updateResult = await Repository.update(TagsEntity, { id: insertedId }, updateData);
                                this.logger.log(`[createTagAndAttachToCampaign] ✅ Resultado da atualização forçada:`, updateResult);
                                
                                // Aguardar um pouco e verificar novamente
                                await new Promise(resolve => setTimeout(resolve, 200));

                                const verifyAfterUpdate = await Repository.findOne(TagsEntity, { id: insertedId });
                                if (verifyAfterUpdate) {
                                    this.logger.log(`[createTagAndAttachToCampaign] ✅ Após atualização forçada:`, {
                                        scriptSettingId: verifyAfterUpdate.scriptSettingId,
                                        campaignIds: verifyAfterUpdate.campaignIds,
                                        generatedCode: verifyAfterUpdate.generatedCode,
                                        sellerUrl: verifyAfterUpdate.sellerUrl,
                                        generatedScript: verifyAfterUpdate.generatedScript ? 'presente' : 'null'
                                    });

                                    // Se ainda estiver faltando, é um problema sério
                                    const stillMissing: string[] = [];
                                    if (!verifyAfterUpdate.scriptSettingId && dataToInsert.scriptSettingId) stillMissing.push('scriptSettingId');
                                    if (!verifyAfterUpdate.campaignIds && dataToInsert.campaignIds) stillMissing.push('campaignIds');
                                    if (!verifyAfterUpdate.generatedCode && dataToInsert.generatedCode) stillMissing.push('generatedCode');
                                    if (!verifyAfterUpdate.sellerUrl && dataToInsert.sellerUrl) stillMissing.push('sellerUrl');
                                    
                                    if (stillMissing.length > 0) {
                                        this.logger.error(`[createTagAndAttachToCampaign] ❌ CRÍTICO: Campos ainda faltando após atualização forçada: ${stillMissing.join(', ')}`);
                                        this.logger.error(`[createTagAndAttachToCampaign] Isso indica um problema grave com o Repository.update ou com o schema do banco.`);
                                    }
                                } else {
                                    this.logger.error(`[createTagAndAttachToCampaign] ❌ CRÍTICO: Tag não encontrada após atualização forçada!`);
                                }
                            } catch (updateError: any) {
                                this.logger.error(`[createTagAndAttachToCampaign] ❌ Erro ao atualizar campos faltantes:`, updateError);
                                this.logger.error(`[createTagAndAttachToCampaign] Stack:`, updateError.stack);
                            }
                        } else {
                            this.logger.log(`[createTagAndAttachToCampaign] ✅ Tag verificada no banco. ID: ${verify.id}, generatedCode: ${verify.generatedCode}, scriptStatus: ${verify.scriptStatus}`);
                        }
                    }
                } else {
                    this.logger.error(`[createTagAndAttachToCampaign] ⚠️ ATENÇÃO: Inserção retornou sem ID! Resultado:`, JSON.stringify(inserted));
                }
                
                // Usar insertedData para o resto do código
                inserted = insertedData || inserted;
            } catch (insertError: any) {
                this.logger.error(`[createTagAndAttachToCampaign] ❌ Erro ao inserir tag no banco de dados:`, insertError);
                this.logger.error(`[createTagAndAttachToCampaign] Tipo do erro: ${insertError?.constructor?.name || 'Unknown'}`);
                this.logger.error(`[createTagAndAttachToCampaign] Mensagem: ${insertError?.message || 'Sem mensagem'}`);
                this.logger.error(`[createTagAndAttachToCampaign] Código: ${insertError?.code || 'Sem código'}`);
                if (insertError?.stack) {
                    this.logger.error(`[createTagAndAttachToCampaign] Stack trace:`, insertError.stack);
                }
                
                // Verificar se é erro de schema
                if (insertError?.message?.includes('no such column') || 
                    insertError?.message?.includes('SQLITE_ERROR') ||
                    insertError?.code === 'SQLITE_ERROR') {
                    this.logger.error(`[createTagAndAttachToCampaign] ⚠️ ERRO DE SCHEMA DETECTADO!`);
                    this.logger.error(`[createTagAndAttachToCampaign] Execute o script de migração: add-tag-script-status-column.sql`);
                }
                
                throw insertError;
            }

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
            if (campaignId && dataToInsert?.generatedScript) {
                await Repository.update(CampaignsEntity, { id: campaignId }, {
                    script: dataToInsert.generatedScript
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

    /**
     * Carrega a lista de proxies do arquivo sas/proxies.txt
     */
    private loadProxies(): string[] {
        if (this.proxies !== null) {
            return this.proxies;
        }

        try {
            // Caminho relativo ao dist da API: ../../proxies.txt
            const proxiesPath = path.resolve(process.cwd(), "proxies.txt");
            if (!fs.existsSync(proxiesPath)) {
                this.logger.log(`[ScriptValidator] Arquivo de proxies não encontrado em: ${proxiesPath}`);
                this.proxies = [];
                return this.proxies;
            }

            const content = fs.readFileSync(proxiesPath, "utf8");
            this.proxies = content
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line && !line.startsWith("#"));

            this.logger.log(`[ScriptValidator] ${this.proxies.length} proxies carregados do arquivo`);
            return this.proxies;
        } catch (error: any) {
            this.logger.error("[ScriptValidator] Erro ao carregar proxies:", error);
            this.proxies = [];
            return this.proxies;
        }
    }

    /**
     * Seleciona um proxy aleatório da lista (se existir)
     */
    private getRandomProxy(): string | null {
        const proxies = this.loadProxies();
        if (!proxies || proxies.length === 0) {
            return null;
        }
        const index = Math.floor(Math.random() * proxies.length);
        return proxies[index];
    }

    /**
     * Faz download do HTML da página destino usando Puppeteer (headless browser)
     * para capturar scripts carregados dinamicamente via JavaScript.
     */
    private async fetchPageHtml(url: string): Promise<string | null> {
        const normalizedUrl = this.normalizeUrl(url);
        let browser: any = null;

        try {
            // Importar puppeteer apenas quando necessário (lazy import)
            const puppeteer = await import("puppeteer");
            
            this.logger.log(`[ScriptValidator] Iniciando navegador headless para: ${normalizedUrl}`);

            // Configurar proxy se disponível
            const proxy = this.getRandomProxy();
            const launchOptions: any = {
                headless: "new", // Usar novo modo headless (evita deprecation warning)
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                    '--disable-blink-features=AutomationControlled' // Evitar detecção de bot
                ]
            };

            // Tentar usar Chrome do sistema se disponível (útil em WSL/Linux)
            // Se não encontrar, o Puppeteer tentará baixar automaticamente
            try {
                // Verificar se há Chrome/Chromium instalado no sistema
                const { execSync } = require('child_process');
                try {
                    execSync('which google-chrome || which chromium || which chromium-browser', { stdio: 'ignore' });
                    // Se chegou aqui, há Chrome/Chromium no sistema
                    // Puppeteer tentará usar automaticamente
                } catch {
                    // Chrome não encontrado no PATH, Puppeteer usará o bundled
                }
            } catch {
                // Ignorar erros ao verificar Chrome do sistema
            }

            if (proxy) {
                this.logger.log(`[ScriptValidator] Usando proxy para navegador headless: ${proxy}`);
                // Extrair host e porta do proxy
                const proxyMatch = proxy.match(/http:\/\/([^:]+):(\d+)/);
                if (proxyMatch) {
                    launchOptions.args.push(`--proxy-server=${proxy}`);
                }
            }

            // Lançar navegador
            browser = await puppeteer.default.launch(launchOptions);
            const page = await browser.newPage();

            // Configurar User-Agent e outros headers
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            });

            // Navegar para a página com timeout de 60 segundos
            this.logger.log(`[ScriptValidator] Navegando para: ${normalizedUrl}`);
            await page.goto(normalizedUrl, {
                waitUntil: 'networkidle2', // Aguarda até que não haja mais de 2 conexões de rede por pelo menos 500ms
                timeout: 60000
            });

            // Aguardar 30 segundos adicionais para scripts dinâmicos carregarem completamente
            this.logger.log(`[ScriptValidator] Aguardando 30s para scripts dinâmicos carregarem...`);
            await page.waitForTimeout(30000);

            // Capturar o HTML renderizado (incluindo scripts injetados dinamicamente)
            const html = await page.content();
            this.logger.log(`[ScriptValidator] HTML capturado do navegador headless: ${html.length} caracteres`);

            await browser.close();
            browser = null;

            return html || null;
        } catch (error: any) {
            if (browser) {
                try {
                    await browser.close();
                } catch (closeError) {
                    // Ignorar erros ao fechar
                }
            }

            if (error.message?.includes('Could not find Chrome') || error.message?.includes('Chrome')) {
                this.logger.error(
                    `[ScriptValidator] Chrome não encontrado para Puppeteer.\n` +
                    `  Para instalar, execute no diretório do projeto:\n` +
                    `  npx puppeteer browsers install chrome\n` +
                    `  Ou no WSL: cd /mnt/c/Users/ferna/Desktop/Projetos/sas && npx puppeteer browsers install chrome`
                );
            } else if (error.message?.includes('timeout') || error.message?.includes('Navigation timeout')) {
                this.logger.log(`[ScriptValidator] Timeout ao carregar página ${normalizedUrl} no navegador headless`);
            } else {
                this.logger.error(`[ScriptValidator] Erro ao usar navegador headless para ${normalizedUrl}:`, error);
            }

            // Fallback: tentar com fetch simples se Puppeteer falhar
            this.logger.log(`[ScriptValidator] Tentando fallback com fetch simples...`);
            return await this.fetchPageHtmlFallback(normalizedUrl);
        }
    }

    /**
     * Fallback: faz download do HTML usando fetch simples (caso Puppeteer falhe)
     */
    private async fetchPageHtmlFallback(url: string): Promise<string | null> {
        const normalizedUrl = this.normalizeUrl(url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            this.logger.log(`[ScriptValidator] Fazendo GET (fallback) em: ${normalizedUrl}`);

            const response = await fetch(normalizedUrl, {
                method: "GET",
                signal: controller.signal,
                redirect: "follow",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Connection": "keep-alive",
                    "Cache-Control": "no-cache"
                }
            } as any);

            clearTimeout(timeoutId);

            if (!response || !response.ok) {
                this.logger.log(`[ScriptValidator] Resposta inválida (fallback) para ${normalizedUrl}: status=${response?.status}`);
                return null;
            }

            const html = await (response as any).text();
            return html || null;
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === "AbortError" || error.message?.includes("aborted")) {
                this.logger.log(`[ScriptValidator] Timeout (fallback) ao buscar HTML de ${normalizedUrl}`);
            } else {
                this.logger.error(`[ScriptValidator] Erro (fallback) ao buscar HTML de ${normalizedUrl}:`, error);
            }
            return null;
        }
    }

    /**
     * Normaliza uma URL (adiciona https:// se necessário)
     */
    private normalizeUrl(url: string): string {
        let normalized = (url || "").trim();
        if (!normalized.match(/^https?:\/\//i)) {
            normalized = `https://${normalized}`;
        }
        return normalized;
    }

    /**
     * Extrai a URL do script a partir do campo generatedScript da tag
     * Suporta múltiplos formatos: '...', "...", sem aspas, etc.
     */
    private extractScriptUrlFromGeneratedScript(generatedScript: string | null | undefined): string | null {
        if (!generatedScript) return null;
        try {
            // Tentar múltiplos padrões
            const patterns = [
                /script\.src\s*=\s*'([^']+)'/,           // script.src = '...'
                /script\.src\s*=\s*"([^"]+)"/,          // script.src = "..."
                /script\.src\s*=\s*`([^`]+)`/,          // script.src = `...`
                /script\.src\s*=\s*([^\s;'">]+)/,       // script.src = ... (sem aspas)
                /src\s*=\s*['"]([^'"]+\.js[^'"]*)/,     // src="...js"
                /['"](https?:\/\/[^'"]+\.js[^'"]*)/      // Qualquer URL .js entre aspas
            ];

            for (const pattern of patterns) {
                const match = generatedScript.match(pattern);
                if (match && match[1]) {
                    const url = match[1].trim();
                    // Validar que é uma URL válida
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        return url;
                    }
                }
            }
        } catch (error: any) {
            this.logger.error(`[ScriptValidator] Erro ao extrair URL do script:`, error);
        }
        return null;
    }

    /**
     * Escapa caracteres especiais para uso em regex
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Método de debug: analisa o HTML e loga informações relevantes quando o script não é encontrado
     */
    private logDebugInfo(html: string, scriptUrl: string, code: string, domain: string | null) {
        try {
            // Buscar todas as ocorrências de "script" no HTML (case-insensitive)
            const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
            this.logger.log(`[ScriptValidator DEBUG] Encontradas ${scriptMatches.length} tags <script> no HTML`);

            // Buscar ocorrências do código em qualquer contexto
            const codeMatches = html.match(new RegExp(`[^\\s]{0,50}${this.escapeRegex(code)}[^\\s]{0,50}`, 'gi')) || [];
            if (codeMatches.length > 0) {
                this.logger.log(`[ScriptValidator DEBUG] Encontradas ${codeMatches.length} ocorrências do código "${code}" no HTML:`);
                codeMatches.slice(0, 5).forEach((match, idx) => {
                    this.logger.log(`[ScriptValidator DEBUG]   Ocorrência ${idx + 1}: ${match.substring(0, 200)}`);
                });
            } else {
                this.logger.log(`[ScriptValidator DEBUG] Código "${code}" NÃO encontrado no HTML`);
            }

            // Buscar ocorrências do domínio
            if (domain) {
                const domainMatches = html.match(new RegExp(`[^\\s]{0,50}${this.escapeRegex(domain)}[^\\s]{0,50}`, 'gi')) || [];
                if (domainMatches.length > 0) {
                    this.logger.log(`[ScriptValidator DEBUG] Encontradas ${domainMatches.length} ocorrências do domínio "${domain}" no HTML`);
                } else {
                    this.logger.log(`[ScriptValidator DEBUG] Domínio "${domain}" NÃO encontrado no HTML`);
                }
            }

            // Buscar por padrões comuns de script dinâmico
            const dynamicPatterns = [
                /document\.createElement\s*\(\s*['"]script['"]\s*\)/gi,
                /appendChild\s*\(/gi,
                /\.src\s*=/gi
            ];

            dynamicPatterns.forEach((pattern, idx) => {
                const matches = html.match(pattern) || [];
                if (matches.length > 0) {
                    this.logger.log(`[ScriptValidator DEBUG] Padrão dinâmico ${idx + 1} encontrado ${matches.length} vezes`);
                }
            });

            // Logar um trecho do HTML onde o código deveria estar (se houver menção ao domínio)
            if (domain && html.toLowerCase().includes(domain.toLowerCase())) {
                const domainIndex = html.toLowerCase().indexOf(domain.toLowerCase());
                const snippetStart = Math.max(0, domainIndex - 200);
                const snippetEnd = Math.min(html.length, domainIndex + 500);
                const snippet = html.substring(snippetStart, snippetEnd);
                this.logger.log(`[ScriptValidator DEBUG] Trecho do HTML próximo ao domínio "${domain}":\n${snippet}`);
            }
        } catch (error: any) {
            this.logger.error(`[ScriptValidator DEBUG] Erro ao analisar HTML para debug:`, error);
        }
    }

    /**
     * Valida o script de uma única tag: verifica se o script está presente na página da campanha.
     */
    private async validateSingleTagScript(tag: any, CampaignsEntity: any) {
        // Deve ter script gerado e campanhas vinculadas
        if (!tag || !tag.generatedScript || !tag.campaignIds) {
            return {
                tagId: tag?.id,
                status: "ignorado",
                reason: "Tag sem script gerado ou sem campanha vinculada"
            };
        }

        // Extrair URL do script
        const scriptUrl = this.extractScriptUrlFromGeneratedScript(tag.generatedScript);
        if (!scriptUrl) {
            return {
                tagId: tag.id,
                status: "erro",
                reason: "Não foi possível extrair a URL do script"
            };
        }

        // Descobrir campanha vinculada (primeiro ID)
        let campaignId: string | null = null;
        try {
            const parsed = typeof tag.campaignIds === "string"
                ? JSON.parse(tag.campaignIds)
                : tag.campaignIds;
            if (Array.isArray(parsed) && parsed.length > 0) {
                campaignId = parsed[0];
            }
        } catch (error: any) {
            this.logger.error(`[ScriptValidator] Erro ao parsear campaignIds para tag ${tag.id}:`, error);
        }

        if (!campaignId) {
            return {
                tagId: tag.id,
                status: "erro",
                reason: "Nenhuma campanha válida vinculada à tag"
            };
        }

        // Buscar campanha
        const campaign = await Repository.findOne(CampaignsEntity, { id: campaignId });
        if (!campaign) {
            return {
                tagId: tag.id,
                campaignId,
                status: "erro",
                reason: "Campanha vinculada não encontrada"
            };
        }

        // Determinar URL da página do seller
        let pageUrl: string | null = null;
        if (campaign.sellerDomain && String(campaign.sellerDomain).trim() !== "") {
            pageUrl = String(campaign.sellerDomain).trim();
        } else if (campaign.link && String(campaign.link).trim() !== "") {
            // Fallback: usar link da campanha, se o domínio não estiver preenchido
            pageUrl = String(campaign.link).trim();
        }

        if (!pageUrl) {
            return {
                tagId: tag.id,
                campaignId,
                status: "erro",
                reason: "Campanha sem domínio seller ou link configurado"
            };
        }

        const finalPageUrl = this.normalizeUrl(pageUrl);

        // Buscar HTML da página
        const html = await this.fetchPageHtml(finalPageUrl);
        if (!html) {
            return {
                tagId: tag.id,
                campaignId,
                pageUrl: finalPageUrl,
                scriptUrl,
                status: "erro",
                reason: "Não foi possível obter o HTML da página"
            };
        }

        // Múltiplas estratégias de detecção para aumentar a taxa de sucesso
        const detectionResults: any = {
            foundByUrl: false,
            foundByUrlCaseInsensitive: false,
            foundByCode: false,
            foundByCodeCaseInsensitive: false,
            foundByDomainAndCode: false,
            foundByScriptTag: false,
            foundByDynamicScript: false,
            foundByEscapedUrl: false
        };

        const htmlLower = html.toLowerCase();
        const scriptUrlLower = scriptUrl.toLowerCase();

        // 1) Buscar a URL completa do script no HTML (case-sensitive)
        detectionResults.foundByUrl = html.includes(scriptUrl);

        // 2) Buscar a URL completa do script no HTML (case-insensitive)
        detectionResults.foundByUrlCaseInsensitive = htmlLower.includes(scriptUrlLower);

        // 3) Extrair código da tag (ex: dio31ds4h6as25520)
        let codeFromUrl: string | null = null;
        let domainFromUrl: string | null = null;

        try {
            // Extrair código: último segmento antes de .js
            const matchCode = scriptUrl.match(/\/([^\/]+)\.js(?:[\?'"]|$)/i);
            if (matchCode && matchCode[1]) {
                codeFromUrl = matchCode[1];
            }

            // Extrair domínio: adtag.cloud, rt-pixel.com, etc.
            const matchDomain = scriptUrl.match(/https?:\/\/([^\/]+)\//i);
            if (matchDomain && matchDomain[1]) {
                domainFromUrl = matchDomain[1];
            }
        } catch (error: any) {
            this.logger.error(`[ScriptValidator] Erro ao extrair código/domínio de ${scriptUrl}:`, error);
        }

        // 4) Buscar apenas o código (case-sensitive)
        if (codeFromUrl) {
            detectionResults.foundByCode = html.includes(codeFromUrl);
        }

        // 5) Buscar apenas o código (case-insensitive)
        if (codeFromUrl) {
            detectionResults.foundByCodeCaseInsensitive = htmlLower.includes(codeFromUrl.toLowerCase());
            
            // 5b) Buscar partes do código (últimos 8-12 caracteres) para casos onde o código pode estar truncado
            if (!detectionResults.foundByCodeCaseInsensitive && codeFromUrl.length > 8) {
                const codeSuffix = codeFromUrl.substring(codeFromUrl.length - 12).toLowerCase();
                detectionResults.foundByCodeCaseInsensitive = htmlLower.includes(codeSuffix);
                if (detectionResults.foundByCodeCaseInsensitive) {
                    this.logger.log(`[ScriptValidator] Código encontrado parcialmente (sufixo): ${codeSuffix}`);
                }
            }
        }

        // 6) Buscar domínio + código (ex: "adtag.cloud" e "dio31ds4h6as25520" próximos)
        if (domainFromUrl && codeFromUrl) {
            const domainLower = domainFromUrl.toLowerCase();
            const codeLower = codeFromUrl.toLowerCase();
            // Verificar se ambos aparecem no HTML (não necessariamente juntos)
            const hasDomain = htmlLower.includes(domainLower);
            const hasCode = htmlLower.includes(codeLower);
            detectionResults.foundByDomainAndCode = hasDomain && hasCode;
        }

        // 7) Buscar em tags <script> (procurar por script.src ou script tags com a URL)
        try {
            // Padrão: script.src = '...' ou script.src = "..."
            const scriptSrcPattern = new RegExp(
                `script\\.src\\s*=\\s*['"]?${this.escapeRegex(scriptUrl)}['"]?`,
                'i'
            );
            detectionResults.foundByScriptTag = scriptSrcPattern.test(html);

            // Também procurar por <script src="...">
            const scriptTagPattern = new RegExp(
                `<script[^>]*src\\s*=\\s*['"]?${this.escapeRegex(scriptUrl)}['"]?[^>]*>`,
                'i'
            );
            if (!detectionResults.foundByScriptTag) {
                detectionResults.foundByScriptTag = scriptTagPattern.test(html);
            }
        } catch (error: any) {
            this.logger.error(`[ScriptValidator] Erro ao buscar em tags script:`, error);
        }

        // 8) Buscar por criação dinâmica de script (document.createElement('script'))
        if (codeFromUrl) {
            try {
                // Padrão comum: document.createElement('script') seguido do código
                // Buscar em um contexto maior (até 2000 caracteres entre createElement e o código)
                const dynamicPattern = new RegExp(
                    `document\\.createElement\\s*\\(\\s*['"]script['"]\\s*\\)[\\s\\S]{0,2000}${this.escapeRegex(codeFromUrl)}`,
                    'i'
                );
                detectionResults.foundByDynamicScript = dynamicPattern.test(html);
                
                // Também buscar padrão alternativo: qualquer menção ao código próximo a "script" ou "src"
                if (!detectionResults.foundByDynamicScript) {
                    const altPattern = new RegExp(
                        `(script|src|appendChild)[\\s\\S]{0,500}${this.escapeRegex(codeFromUrl)}`,
                        'i'
                    );
                    detectionResults.foundByDynamicScript = altPattern.test(html);
                }
            } catch (error: any) {
                // Ignorar erros de regex
            }
        }

        // 9) Buscar URL com escape (ex: https:\/\/adtag.cloud)
        try {
            const escapedUrl = scriptUrl.replace(/\//g, '\\/');
            detectionResults.foundByEscapedUrl = html.includes(escapedUrl) || htmlLower.includes(escapedUrl.toLowerCase());
        } catch {
            // Ignorar erros
        }

        // Considerar encontrado se QUALQUER estratégia funcionar
        const found = Object.values(detectionResults).some((value: any) => value === true);

        // Log detalhado para debug
        this.logger.log(
            `[ScriptValidator] Resultado para tag ${tag.id} / campanha ${campaignId}\n` +
            `  URL da página: ${finalPageUrl}\n` +
            `  Script URL: ${scriptUrl}\n` +
            `  Código extraído: ${codeFromUrl || "N/A"}\n` +
            `  Domínio extraído: ${domainFromUrl || "N/A"}\n` +
            `  Estratégias de detecção:\n` +
            `    - URL completa (case-sensitive): ${detectionResults.foundByUrl}\n` +
            `    - URL completa (case-insensitive): ${detectionResults.foundByUrlCaseInsensitive}\n` +
            `    - Código apenas (case-sensitive): ${detectionResults.foundByCode}\n` +
            `    - Código apenas (case-insensitive): ${detectionResults.foundByCodeCaseInsensitive}\n` +
            `    - Domínio + código: ${detectionResults.foundByDomainAndCode}\n` +
            `    - Em tag <script>: ${detectionResults.foundByScriptTag}\n` +
            `    - Criação dinâmica: ${detectionResults.foundByDynamicScript}\n` +
            `    - URL com escape: ${detectionResults.foundByEscapedUrl}\n` +
            `  RESULTADO FINAL: ${found ? "ENCONTRADO" : "NÃO ENCONTRADO"}\n` +
            `  Tamanho do HTML: ${html.length} caracteres`
        );

        // Se não encontrou, fazer uma busca mais profunda e logar trechos relevantes
        if (!found && codeFromUrl) {
            this.logDebugInfo(html, scriptUrl, codeFromUrl, domainFromUrl);
        }

        return {
            tagId: tag.id,
            campaignId,
            pageUrl: finalPageUrl,
            scriptUrl,
            status: found ? "encontrado" : "nao_encontrado"
        };
    }

    /**
     * Valida os scripts de todas as tags.
     * Retorna um resumo com total, encontrados, não encontrados e erros.
     */
    async validateAllTagsScripts() {
        const TagsEntity = Repository.getEntity("SasTagsEntity");
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");

        this.logger.log("[ScriptValidator] Iniciando validação de scripts de todas as tags...");

        const result = await Repository.findAll(TagsEntity, {}, [], { take: 10000 });
        const tags = result?.data || [];

        let total = tags.length;
        let validated = 0;
        let encontrados = 0;
        let naoEncontrados = 0;
        let erros = 0;

        const detalhes: any[] = [];

        for (const tag of tags) {
            try {
                const validationResult = await this.validateSingleTagScript(tag, CampaignsEntity);

                if (!validationResult) continue;

                if (validationResult.status === "ignorado") {
                    detalhes.push(validationResult);
                    continue;
                }

                validated++;

                // Determinar novo status baseado na lógica de negócio
                const previousStatus = tag.scriptStatus || "Não verificada";
                let newStatus: string;

                if (validationResult.status === "encontrado") {
                    newStatus = "Ativo";
                    encontrados++;
                } else if (validationResult.status === "nao_encontrado") {
                    // Se estava "Ativo" e agora não encontrado = "Caiu"
                    // Se nunca foi validado = "Não verificada"
                    if (previousStatus === "Ativo") {
                        newStatus = "Caiu";
                    } else {
                        newStatus = "Não verificada";
                    }
                    naoEncontrados++;
                } else {
                    // Erro: manter status atual ou definir como "Não verificada"
                    newStatus = previousStatus === "Não verificada" ? "Não verificada" : previousStatus;
                    erros++;
                }

                // Atualizar status da tag no banco de dados
                try {
                    await Repository.update(TagsEntity, { id: tag.id }, {
                        scriptStatus: newStatus
                    });
                    this.logger.log(`[ScriptValidator] Tag ${tag.id} atualizada: ${previousStatus} -> ${newStatus}`);
                } catch (updateError: any) {
                    this.logger.error(`[ScriptValidator] Erro ao atualizar status da tag ${tag.id}:`, updateError);
                }

                detalhes.push({
                    ...validationResult,
                    previousStatus,
                    newStatus
                });
            } catch (error: any) {
                erros++;
                this.logger.error(`[ScriptValidator] Erro ao validar tag ${tag?.id}:`, error);
                detalhes.push({
                    tagId: tag?.id,
                    status: "erro",
                    reason: error?.message || "Erro desconhecido"
                });
            }
        }

        const resumo = {
            total,
            validated,
            encontrados,
            naoEncontrados,
            erros,
            detalhes
        };

        this.logger.log(`[ScriptValidator] Validação concluída. Total: ${total}, Validadas: ${validated}, Encontradas: ${encontrados}, Não encontradas: ${naoEncontrados}, Erros: ${erros}`);

        return resumo;
    }

    /**
     * Tarefa agendada: a cada 2h, validar scripts de todas as tags.
     */
    @Cron("0 */2 * * *")
    async validateAllTagsScriptsCron() {
        // Verificar se o contexto this está disponível
        if (!this || !this.logger) {
            console.error("[SasTagsCustomService] Contexto this/logger indisponível no cron de validação de scripts");
            return;
        }

        try {
            await this.validateAllTagsScripts();
        } catch (error: any) {
            if (this && this.logger) {
                this.logger.error("[SasTagsCustomService] Erro no cron de validação de scripts:", error);
            } else {
                console.error("[SasTagsCustomService] Erro no cron de validação de scripts:", error);
            }
        }
    }

    async getAllTags() {
        try {
            const TagsEntity = Repository.getEntity("SasTagsEntity");
            this.logger.log(`[getAllTags] Buscando todas as tags...`);

            // Primeiro, contar quantas tags existem
            const totalCount = await Repository.count(TagsEntity, {});
            this.logger.log(`[getAllTags] Total de tags no banco: ${totalCount}`);

            // Buscar todas as tags usando limite alto (como fazem outros métodos)
            const result = await Repository.findAll(TagsEntity, {
                limit: 10000  // Limite alto para pegar todas as tags
            }, []);

            const returnedCount = result?.data?.length || 0;

            this.logger.log(`[getAllTags] Tags retornadas: ${returnedCount} de ${totalCount} esperadas`);

            if (result?.data && result.data.length > 0) {
                this.logger.log(`[getAllTags] Primeira tag: ID=${result.data[0].id}, scriptSettingId=${result.data[0].scriptSettingId || 'null'}, generatedCode=${result.data[0].generatedCode || 'null'}`);
            } else if (totalCount > 0) {
                this.logger.error(`[getAllTags] ⚠️ ATENÇÃO: Existem ${totalCount} tags no banco, mas nenhuma foi retornada!`);
            }

            // Se retornou menos que o total, tentar buscar todas de novo sem filtros
            if (returnedCount < totalCount) {
                this.logger.log(`[getAllTags] ⚠️ Retornou ${returnedCount} de ${totalCount}. Tentando buscar novamente sem limite...`);

                const resultUnlimited = await Repository.findAll(TagsEntity, {}, []);
                const unlimitedCount = resultUnlimited?.data?.length || 0;

                this.logger.log(`[getAllTags] Tags retornadas sem limite: ${unlimitedCount}`);

                if (unlimitedCount >= totalCount) {
                    this.logger.log(`[getAllTags] ✅ Retornando ${unlimitedCount} tags`);
                    return resultUnlimited;
                }
            }

            this.logger.log(`[getAllTags] ✅ Retornando ${returnedCount} tags`);
            return result;
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
            const setting = await Repository.findOne(ScriptSettingsEntity, { id: scriptSettingId });

            if (!setting) {
                throw new Error(`Modelo de script com ID ${scriptSettingId} não encontrado`);
            }

            // Proteger contra uso incorreto em modelos personalizados
            if (setting.startCode === "__CUSTOM__") {
                throw new Error(`O modelo de script ${scriptSettingId} é personalizado e não suporta geração sequencial de código.`);
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

