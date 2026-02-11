import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from '@cmmv/repository';
import { SimplesNacionalCnaeController } from './simples-nacional-cnae.controller';

vi.mock('@cmmv/repository', () => ({
    Repository: {
        getEntity: vi.fn(),
        findAll: vi.fn(),
        findOne: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }
}));

describe('SimplesNacionalCnaeController', () => {
    let controller: SimplesNacionalCnaeController;
    const mockEntity = { name: 'SasSimplesNacionalCnaeEntity' };

    beforeEach(() => {
        vi.clearAllMocks();
        (Repository.getEntity as ReturnType<typeof vi.fn>).mockReturnValue(mockEntity);
        controller = new SimplesNacionalCnaeController();
    });

    it('getAll deve retornar lista de CNAEs da tabela sas_simples_nacional_cnae', async () => {
        const mockCnaes = [
            { id: 'cnae-1', code: '0111-3/01', denominacao: 'Cultivo de arroz', annex_code: 'I' },
            { id: 'cnae-2', code: '0111-3/02', denominacao: 'Cultivo de milho', annex_code: 'I' }
        ];
        (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(mockCnaes);

        const result = await controller.getAll({});

        expect(Repository.getEntity).toHaveBeenCalledWith('SasSimplesNacionalCnaeEntity');
        expect(Repository.findAll).toHaveBeenCalledWith(mockEntity, {}, []);
        expect(result).toEqual(mockCnaes);
    });

    it('getAll deve repassar queries ao Repository.findAll', async () => {
        (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        await controller.getAll({ limit: '100' });

        expect(Repository.findAll).toHaveBeenCalledWith(mockEntity, { limit: '100' }, []);
    });

    it('create deve gerar id a partir do codigo e converter fator_r para 0/1', async () => {
        const body = { code: '0111-3/01', denominacao: 'Cultivo de arroz', annex_code: 'I', fator_r: true };
        (Repository.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cnae-0111-3-01', ...body });

        await controller.create(body);

        expect(Repository.insert).toHaveBeenCalledWith(mockEntity, expect.objectContaining({
            id: 'cnae-0111-3-01',
            code: '0111-3/01',
            denominacao: 'Cultivo de arroz',
            annex_code: 'I',
            fator_r: 1
        }));
    });

    it('getById deve retornar um CNAE pelo id', async () => {
        const mockCnae = { id: 'cnae-0111-3-01', code: '0111-3/01', denominacao: 'Cultivo de arroz', annex_code: 'I' };
        (Repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(mockCnae);

        const result = await controller.getById('cnae-0111-3-01');

        expect(Repository.findOne).toHaveBeenCalledWith(mockEntity, { id: 'cnae-0111-3-01' });
        expect(result).toEqual(mockCnae);
    });
});
