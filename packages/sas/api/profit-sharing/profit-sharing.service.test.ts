import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from '@cmmv/repository';
import { ProfitSharingService } from './profit-sharing.service';

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

describe('ProfitSharingService', () => {
    let service: ProfitSharingService;
    const mockPaymentOrdersEntity = { name: 'SasPaymentOrdersEntity' };

    beforeEach(() => {
        vi.clearAllMocks();
        (Repository.getEntity as ReturnType<typeof vi.fn>).mockReturnValue(mockPaymentOrdersEntity);
        service = new ProfitSharingService();
    });

    describe('getMonthlyOrders', () => {
        it('deve retornar ordens do mes quando effectivePaymentDate esta no mes/ano', async () => {
            const ordersInMonth = [
                {
                    id: 'o1',
                    status: 'Pago',
                    effectivePaymentDate: '2025-03-15T12:00:00.000Z',
                    currency: 'BRL',
                    invoiceAmount: 1000,
                    paidValue: 1000
                }
            ];
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({ data: ordersInMonth });

            const result = await service.getMonthlyOrders(2025, 3);

            expect(Repository.getEntity).toHaveBeenCalledWith('SasPaymentOrdersEntity');
            expect(Repository.findAll).toHaveBeenCalledWith(mockPaymentOrdersEntity, { status: 'Pago', limit: 10000 }, []);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe('o1');
        });

        it('deve retornar array vazio quando nao ha ordens no banco', async () => {
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

            const result = await service.getMonthlyOrders(2025, 1);

            expect(result.data).toEqual([]);
        });

        it('deve filtrar ordens fora do mes (effectivePaymentDate em outro mes)', async () => {
            const allOrders = [
                { id: 'o1', status: 'Pago', effectivePaymentDate: '2025-02-10T12:00:00.000Z' },
                { id: 'o2', status: 'Pago', effectivePaymentDate: '2025-04-10T12:00:00.000Z' }
            ];
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({ data: allOrders });

            const result = await service.getMonthlyOrders(2025, 3);

            expect(result.data).toHaveLength(0);
        });
    });
});
