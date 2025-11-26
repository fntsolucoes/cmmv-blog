import { Service, Logger } from "@cmmv/core";

@Service()
export class LinkValidatorService {
    private readonly logger = new Logger("LinkValidatorService");
    private readonly timeout = 30000; // 30 segundos de timeout

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
            this.logger.log(`[DEBUG] Validando link: ${normalizedUrl}`);
            
            // Criar AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            try {
                // Fazer requisição HEAD primeiro (mais leve)
                this.logger.log(`[DEBUG] Tentando HEAD para: ${normalizedUrl}`);
                const response = await fetch(normalizedUrl, {
                    method: 'HEAD',
                    signal: controller.signal,
                    redirect: 'manual', // Seguir redirects manualmente para ter mais controle
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Cache-Control': 'max-age=0'
                    }
                });

                clearTimeout(timeoutId);
                this.logger.log(`[DEBUG] HEAD resposta recebida: status=${response.status}, ok=${response.ok}`);

                // Se for redirect (301, 302, 303, 307, 308), seguir manualmente
                if (response.status >= 300 && response.status < 400) {
                    const location = response.headers.get('location');
                    if (location) {
                        this.logger.log(`[DEBUG] HEAD redirect detectado: ${normalizedUrl} -> ${location}`);
                        // Se o redirect for relativo, construir URL absoluta
                        const redirectUrl = location.startsWith('http') ? location : new URL(location, normalizedUrl).toString();
                        // Tentar seguir o redirect (máximo 5 redirects)
                        return await this.followRedirect(redirectUrl, 0, 5);
                    }
                }

                // Verificar status code
                // Status 2xx e 3xx são considerados válidos (incluindo redirects)
                if (response.status >= 200 && response.status < 400) {
                    // Tentar obter a URL final (pode não estar disponível no fetch do Node.js)
                    let finalUrl = normalizedUrl;
                    try {
                        finalUrl = (response as any).url || response.headers.get('location') || normalizedUrl;
                    } catch (e) {
                        // Se não conseguir obter a URL final, usar a original
                        finalUrl = normalizedUrl;
                    }

                    // Detectar páginas de oferta desabilitada mesmo com status 2xx/3xx
                    if (this.isDisabledLink(finalUrl)) {
                        this.logger.log(`Link redireciona para página desabilitada: ${finalUrl} (Status: ${response.status})`);
                        return 'Quebrado';
                    }

                    this.logger.log(`Link válido: ${normalizedUrl} -> ${finalUrl} (Status: ${response.status})`);
                    return 'OK';
                } else {
                    // Se HEAD retornou erro (404, 405, etc.), tentar GET antes de marcar como quebrado
                    // Alguns servidores bloqueiam HEAD mas permitem GET
                    this.logger.log(`HEAD retornou erro ${response.status} para ${normalizedUrl}, tentando GET...`);
                    // Não retornar aqui, deixar cair no catch para tentar GET
                    throw new Error(`HEAD returned ${response.status}`);
                }
            } catch (headError: any) {
                clearTimeout(timeoutId);
                
                // Se HEAD falhar, tentar GET (alguns servidores não suportam HEAD)
                if (headError.name === 'AbortError' || headError.message?.includes('aborted')) {
                    this.logger.log(`Timeout ao validar link: ${normalizedUrl}`);
                    return 'Quebrado';
                }

                this.logger.log(`HEAD falhou para ${normalizedUrl}, tentando GET...`);
                
                const getController = new AbortController();
                const getTimeoutId = setTimeout(() => getController.abort(), this.timeout);

                try {
                    this.logger.log(`[DEBUG] Tentando GET para: ${normalizedUrl}`);
                    const getResponse = await fetch(normalizedUrl, {
                        method: 'GET',
                        signal: getController.signal,
                        redirect: 'manual', // Seguir redirects manualmente
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1',
                            'Sec-Fetch-Dest': 'document',
                            'Sec-Fetch-Mode': 'navigate',
                            'Sec-Fetch-Site': 'none',
                            'Cache-Control': 'max-age=0',
                            'Referer': 'https://www.google.com/'
                        }
                    });

                    clearTimeout(getTimeoutId);
                    this.logger.log(`[DEBUG] GET resposta recebida: status=${getResponse.status}, ok=${getResponse.ok}`);

                    // Se for redirect (301, 302, 303, 307, 308), seguir manualmente
                    if (getResponse.status >= 300 && getResponse.status < 400) {
                        const location = getResponse.headers.get('location');
                        if (location) {
                            this.logger.log(`[DEBUG] GET redirect detectado: ${normalizedUrl} -> ${location}`);
                            // Se o redirect for relativo, construir URL absoluta
                            const redirectUrl = location.startsWith('http') ? location : new URL(location, normalizedUrl).toString();
                            // Tentar seguir o redirect (máximo 5 redirects)
                            return await this.followRedirect(redirectUrl, 0, 5);
                        }
                    }

                    // Status 2xx e 3xx são considerados válidos (incluindo redirects)
                    if (getResponse.status >= 200 && getResponse.status < 400) {
                        // Tentar obter a URL final (pode não estar disponível no fetch do Node.js)
                        let finalUrl = normalizedUrl;
                        try {
                            finalUrl = (getResponse as any).url || getResponse.headers.get('location') || normalizedUrl;
                        } catch (e) {
                            // Se não conseguir obter a URL final, usar a original
                            finalUrl = normalizedUrl;
                        }

                        // Detectar páginas de oferta desabilitada mesmo com status 2xx/3xx
                        if (this.isDisabledLink(finalUrl)) {
                            this.logger.log(`Link redireciona para página desabilitada (via GET): ${finalUrl} (Status: ${getResponse.status})`);
                            return 'Quebrado';
                        }

                        this.logger.log(`Link válido (via GET): ${normalizedUrl} -> ${finalUrl} (Status: ${getResponse.status})`);
                        return 'OK';
                    } 
                    // Se for 403, considerar OK se não for página disabled (servidor bloqueou bot mas link funciona)
                    else if (getResponse.status === 403) {
                        let finalUrl = normalizedUrl;
                        try {
                            finalUrl = (getResponse as any).url || normalizedUrl;
                        } catch (e) {
                            finalUrl = normalizedUrl;
                        }

                        if (this.isDisabledLink(finalUrl)) {
                            this.logger.log(`Link redireciona para página desabilitada (via GET): ${finalUrl} (Status: ${getResponse.status})`);
                            return 'Quebrado';
                        }

                        this.logger.log(`Link válido (403 = bot detection, mas link funciona): ${normalizedUrl} -> ${finalUrl} (Status: ${getResponse.status})`);
                        return 'OK';
                    } else {
                        this.logger.log(`Link retornou erro (via GET): ${normalizedUrl} (Status: ${getResponse.status})`);
                        return 'Quebrado';
                    }
                } catch (getError: any) {
                    clearTimeout(getTimeoutId);
                    
                    if (getError.name === 'AbortError' || getError.message?.includes('aborted')) {
                        this.logger.log(`Timeout ao validar link (GET): ${normalizedUrl}`);
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

    /**
     * Segue redirects manualmente (quando redirect: 'manual' é usado)
     * @param url - URL para seguir
     * @param currentDepth - Profundidade atual do redirect
     * @param maxDepth - Profundidade máxima permitida
     */
    private async followRedirect(url: string, currentDepth: number, maxDepth: number): Promise<'OK' | 'Quebrado'> {
        if (currentDepth >= maxDepth) {
            this.logger.log(`[DEBUG] Máximo de redirects atingido (${maxDepth}) para: ${url}`);
            return 'Quebrado';
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                redirect: 'manual',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': 'https://www.google.com/'
                }
            });

            clearTimeout(timeoutId);

            // Se for outro redirect, seguir recursivamente
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                if (location) {
                    const redirectUrl = location.startsWith('http') ? location : new URL(location, url).toString();
                    return await this.followRedirect(redirectUrl, currentDepth + 1, maxDepth);
                }
            }

            // Verificar se chegou em uma página válida
            // Status 2xx e 3xx são válidos
            // Status 403 também é considerado válido se chegamos aqui via redirect,
            // pois indica que o servidor está funcionando mas bloqueou por ser bot detection
            if (response.status >= 200 && response.status < 400) {
                const finalUrl = (response as any).url || url;
                if (this.isDisabledLink(finalUrl)) {
                    this.logger.log(`Link redireciona para página desabilitada: ${finalUrl} (Status: ${response.status})`);
                    return 'Quebrado';
                }
                this.logger.log(`Link válido após ${currentDepth + 1} redirect(s): ${url} -> ${finalUrl} (Status: ${response.status})`);
                return 'OK';
            }

            // Se for 403 após redirect, considerar OK (servidor bloqueou bot mas link funciona)
            if (response.status === 403) {
                const finalUrl = (response as any).url || url;
                if (this.isDisabledLink(finalUrl)) {
                    this.logger.log(`Link redireciona para página desabilitada: ${finalUrl} (Status: ${response.status})`);
                    return 'Quebrado';
                }
                this.logger.log(`Link válido (403 = bot detection, mas redirect funcionou): ${url} -> ${finalUrl} (Status: ${response.status})`);
                return 'OK';
            }

            this.logger.log(`Link retornou erro após redirect: ${url} (Status: ${response.status})`);
            return 'Quebrado';
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                this.logger.log(`Timeout ao seguir redirect: ${url}`);
            } else {
                this.logger.error(`Erro ao seguir redirect: ${url}`, error);
            }
            return 'Quebrado';
        }
    }

    /**
     * Detecta URLs que apontam claramente para páginas de oferta desabilitada
     * (por exemplo: .../disabled.html em redes de afiliação)
     */
    private isDisabledLink(url: string): boolean {
        const lower = url.toLowerCase();

        // Páginas conhecidas de desativação em redes de afiliação
        if (lower.includes("disabled")) {
            return true;
        }

        return false;
    }
}

