import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from '@cmmv/repository';
import { PaymentOrdersService } from './payment-orders.service';

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

describe('PaymentOrdersService', () => {
    let service: PaymentOrdersService;
    const mockEntity = { name: 'SasPaymentOrdersEntity' };

    beforeEach(() => {
        vi.clearAllMocks();
        (Repository.getEntity as ReturnType<typeof vi.fn>).mockReturnValue(mockEntity);
        service = new PaymentOrdersService();
    });

    describe('findAllForExport', () => {
        it('deve retornar todas as ordens do banco sem filtros nem limite', async () => {
            const mockOrders = [
                {
                    id: 'id-1',
                    commercialPartnerId: 'partner-1',
                    currency: 'BRL',
                    costCenterId: 'cc-1',
                    invoiceAmount: 1000,
                    taxAmount: 100,
                    discountAmount: 0,
                    withdrawalDate: '2025-01-15',
                    expectedPaymentMonth: '2025-01',
                    status: 'Pendente',
                    createdAt: '2025-01-01T00:00:00.000Z',
                    updatedAt: '2025-01-01T00:00:00.000Z'
                }
            ];
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);

            const result = await service.findAllForExport();

            expect(Repository.getEntity).toHaveBeenCalledWith('SasPaymentOrdersEntity');
            expect(Repository.findAll).toHaveBeenCalledWith(mockEntity, {});
            expect(result).toEqual(mockOrders);
        });

        it('deve retornar array vazio quando nao ha ordens no banco', async () => {
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            const result = await service.findAllForExport();

            expect(Repository.findAll).toHaveBeenCalledWith(mockEntity, {});
            expect(result).toEqual([]);
        });
    });

    describe('updateFromExportCSV', () => {
        const mockCommercialPartnersEntity = { name: 'SasCommercialPartnersEntity' };
        const mockCostCentersEntity = { name: 'SasCostCentersEntity' };

        beforeEach(() => {
            (Repository.getEntity as ReturnType<typeof vi.fn>)
                .mockImplementation((name: string) => {
                    if (name === 'SasPaymentOrdersEntity') return mockEntity;
                    if (name === 'SasCommercialPartnersEntity') return mockCommercialPartnersEntity;
                    if (name === 'SasCostCentersEntity') return mockCostCentersEntity;
                    return {};
                });
        });

        it('deve retornar erro quando CSV e invalido', async () => {
            const result = await service.updateFromExportCSV('invalid\n"csv');

            expect(result.data.updated).toBe(0);
            expect(result.data.errors.length).toBeGreaterThan(0);
            expect(result.data.errors[0]).toContain('Erro ao ler CSV');
        });

        it('deve adicionar erro quando linha nao tem id', async () => {
            const csv = 'id,commercialPartnerId,currency\n,partner-1,BRL';
            (Repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            const result = await service.updateFromExportCSV(csv);

            expect(result.data.updated).toBe(0);
            expect(result.data.errors.some((e: string) => e.includes('id e obrigatorio'))).toBe(true);
        });

        it('deve adicionar erro quando ordem nao existe', async () => {
            const csv = 'id,commercialPartnerId,currency\ninexistente-id,partner-1,BRL';
            (Repository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            const result = await service.updateFromExportCSV(csv);

            expect(result.data.updated).toBe(0);
            expect(result.data.errors.some((e: string) => e.includes('ordem nao encontrada'))).toBe(true);
        });

        it('deve atualizar registro quando CSV valido e ordem existe', async () => {
            const csv = 'id,commercialPartnerId,currency,costCenterId,invoiceAmount,taxAmount,discountAmount,withdrawalDate,expectedPaymentMonth,effectivePaymentDate,paidValue,status,paymentMethod,observations,finalizedForProfitSharingAt,createdAt,updatedAt\n' +
                'ord-1,partner-1,BRL,cc-1,1000,100,0,2025-01-15,2025-01,,,Pendente,,,\n';
            (Repository.findOne as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce({ id: 'ord-1' })
                .mockResolvedValueOnce({ id: 'partner-1' })
                .mockResolvedValueOnce({ id: 'cc-1' });
            (Repository.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const result = await service.updateFromExportCSV(csv);

            expect(result.data.updated).toBe(1);
            expect(result.data.errors).toEqual([]);
            expect(Repository.update).toHaveBeenCalledWith(mockEntity, 'ord-1', expect.objectContaining({
                commercialPartnerId: 'partner-1',
                currency: 'BRL',
                costCenterId: 'cc-1',
                invoiceAmount: 1000,
                taxAmount: 100,
                discountAmount: 0,
                expectedPaymentMonth: '2025-01',
                status: 'Pendente'
            }));
        });
    });
});
