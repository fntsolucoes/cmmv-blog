import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinkValidatorService } from './link-validator.service';

// Mock global fetch
global.fetch = vi.fn();

describe('LinkValidatorService', () => {
    let service: LinkValidatorService;

    beforeEach(() => {
        service = new LinkValidatorService();
        vi.clearAllMocks();
    });

    describe('validateLink', () => {
        it('deve retornar "Quebrado" para URL vazia', async () => {
            const result = await service.validateLink('');
            expect(result).toBe('Quebrado');
        });

        it('deve retornar "Quebrado" para URL com apenas espaços', async () => {
            const result = await service.validateLink('   ');
            expect(result).toBe('Quebrado');
        });

        it('deve retornar "OK" para link válido (status 200)', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200
            });

            const result = await service.validateLink('https://example.com');
            expect(result).toBe('OK');
            expect(global.fetch).toHaveBeenCalledWith(
                'https://example.com',
                expect.objectContaining({
                    method: 'HEAD',
                    signal: expect.any(AbortSignal)
                })
            );
        });

        it('deve retornar "OK" para link válido (status 301)', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 301
            });

            const result = await service.validateLink('https://example.com');
            expect(result).toBe('OK');
        });

        it('deve retornar "Quebrado" para link com status 404', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const result = await service.validateLink('https://example.com/notfound');
            expect(result).toBe('Quebrado');
        });

        it('deve retornar "Quebrado" para link com status 500', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await service.validateLink('https://example.com/error');
            expect(result).toBe('Quebrado');
        });

        it('deve adicionar https:// se URL não começar com http:// ou https://', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200
            });

            const result = await service.validateLink('example.com');
            expect(result).toBe('OK');
            expect(global.fetch).toHaveBeenCalledWith(
                'https://example.com',
                expect.any(Object)
            );
        });

        it('deve tentar GET se HEAD falhar', async () => {
            // HEAD falha
            (global.fetch as any)
                .mockRejectedValueOnce(new Error('Network error'))
                // GET funciona
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200
                });

            const result = await service.validateLink('https://example.com');
            expect(result).toBe('OK');
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('deve retornar "Quebrado" se timeout ocorrer', async () => {
            const abortError = new Error('aborted');
            abortError.name = 'AbortError';
            
            (global.fetch as any).mockRejectedValueOnce(abortError);

            const result = await service.validateLink('https://example.com');
            expect(result).toBe('Quebrado');
        });

        it('deve retornar "Quebrado" se ambos HEAD e GET falharem', async () => {
            (global.fetch as any)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'));

            const result = await service.validateLink('https://example.com');
            expect(result).toBe('Quebrado');
        });

        it('deve usar User-Agent correto nas requisições', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200
            });

            await service.validateLink('https://example.com');
            
            const callArgs = (global.fetch as any).mock.calls[0];
            expect(callArgs[1].headers['User-Agent']).toContain('Mozilla/5.0');
        });
    });

    describe('normalizeUrl', () => {
        it('deve manter URL com https:// como está', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200
            });

            await service.validateLink('https://example.com');
            expect(global.fetch).toHaveBeenCalledWith(
                'https://example.com',
                expect.any(Object)
            );
        });

        it('deve manter URL com http:// como está', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200
            });

            await service.validateLink('http://example.com');
            expect(global.fetch).toHaveBeenCalledWith(
                'http://example.com',
                expect.any(Object)
            );
        });

        it('deve adicionar https:// para URL sem protocolo', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 200
            });

            await service.validateLink('example.com');
            expect(global.fetch).toHaveBeenCalledWith(
                'https://example.com',
                expect.any(Object)
            );
        });
    });
});


