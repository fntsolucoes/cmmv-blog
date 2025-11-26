import { Service, Logger } from "@cmmv/core";

@Service()
export class LinkValidatorService {
    private readonly logger = new Logger("LinkValidatorService");
    private readonly timeout = 10000; // 10 segundos de timeout

    /**
     * Valida se um link está funcionando corretamente
     * @param url - URL a ser validada
     * @returns 'OK' se o link está funcionando, 'Quebrado' caso contrário
     */
    async validateLink(url: string): Promise<'OK' | 'Quebrado'> {
        if (!url || !url.trim()) {
            return 'Quebrado';
        }

        try {
            // Normalizar URL
            const normalizedUrl = this.normalizeUrl(url);
            
            // Criar AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            try {
                // Fazer requisição HEAD primeiro (mais leve)
                const response = await fetch(normalizedUrl, {
                    method: 'HEAD',
                    signal: controller.signal,
                    redirect: 'follow',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                clearTimeout(timeoutId);

                // Verificar status code
                if (response.ok || response.status < 400) {
                    this.logger.log(`Link válido: ${normalizedUrl} (Status: ${response.status})`);
                    return 'OK';
                } else {
                    this.logger.warn(`Link retornou erro: ${normalizedUrl} (Status: ${response.status})`);
                    return 'Quebrado';
                }
            } catch (headError: any) {
                clearTimeout(timeoutId);
                
                // Se HEAD falhar, tentar GET (alguns servidores não suportam HEAD)
                if (headError.name === 'AbortError' || headError.message?.includes('aborted')) {
                    this.logger.warn(`Timeout ao validar link: ${normalizedUrl}`);
                    return 'Quebrado';
                }

                this.logger.log(`HEAD falhou para ${normalizedUrl}, tentando GET...`);
                
                const getController = new AbortController();
                const getTimeoutId = setTimeout(() => getController.abort(), this.timeout);

                try {
                    const getResponse = await fetch(normalizedUrl, {
                        method: 'GET',
                        signal: getController.signal,
                        redirect: 'follow',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });

                    clearTimeout(getTimeoutId);

                    if (getResponse.ok || getResponse.status < 400) {
                        this.logger.log(`Link válido (via GET): ${normalizedUrl} (Status: ${getResponse.status})`);
                        return 'OK';
                    } else {
                        this.logger.warn(`Link retornou erro (via GET): ${normalizedUrl} (Status: ${getResponse.status})`);
                        return 'Quebrado';
                    }
                } catch (getError: any) {
                    clearTimeout(getTimeoutId);
                    
                    if (getError.name === 'AbortError' || getError.message?.includes('aborted')) {
                        this.logger.warn(`Timeout ao validar link (GET): ${normalizedUrl}`);
                    } else {
                        this.logger.error(`Erro ao validar link: ${normalizedUrl}`, getError);
                    }
                    return 'Quebrado';
                }
            }
        } catch (error: any) {
            this.logger.error(`Erro ao validar link: ${url}`, error);
            return 'Quebrado';
        }
    }

    /**
     * Normaliza a URL para garantir formato válido
     */
    private normalizeUrl(url: string): string {
        let normalized = url.trim();
        
        // Se não começa com http:// ou https://, adicionar https://
        if (!normalized.match(/^https?:\/\//i)) {
            normalized = `https://${normalized}`;
        }
        
        return normalized;
    }
}

