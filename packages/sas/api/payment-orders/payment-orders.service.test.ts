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
            expect(Repository.findAll).toHaveBeenCalledWith(mockEntity, { limit: 1000000 });
            expect(result).toEqual(mockOrders);
        });

        it('deve retornar array vazio quando nao ha ordens no banco', async () => {
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            const result = await service.findAllForExport();

            expect(Repository.findAll).toHaveBeenCalledWith(mockEntity, { limit: 1000000 });
            expect(result).toEqual([]);
        });
    });

    describe('recalculateAllTaxes', () => {
        let mockTaxCalcService: any;

        beforeEach(() => {
            mockTaxCalcService = {
                calculate: vi.fn()
            };
            (Repository.getEntity as ReturnType<typeof vi.fn>).mockReturnValue(mockEntity);
            service = new PaymentOrdersService(mockTaxCalcService);
        });

        it('deve recalcular ordens com tax_engine_used = 1 e status diferente de Pago', async () => {
            const orders = [
                { id: 'ord-1', tax_engine_used: 1, status: 'Pendente', costCenterId: 'cc-1', invoiceAmount: 5000, expectedPaymentMonth: '2026-03', mes_referencia_nota: '2026-03' },
                { id: 'ord-2', tax_engine_used: 1, status: 'Pago', costCenterId: 'cc-2', invoiceAmount: 3000, expectedPaymentMonth: '2026-03' },
                { id: 'ord-3', tax_engine_used: 0, status: 'Pendente', costCenterId: 'cc-3', invoiceAmount: 2000, expectedPaymentMonth: '2026-03' },
            ];
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({ data: orders });
            (Repository.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
            mockTaxCalcService.calculate.mockResolvedValue({
                totalDeductions: 500,
                deductions: [
                    { name: 'ISS', amount: 250 },
                    { name: 'IRPJ Adicional', amount: 100 }
                ]
            });

            const result = await service.recalculateAllTaxes();

            expect(result.recalculated).toBe(1);
            expect(result.errors).toEqual([]);
            expect(mockTaxCalcService.calculate).toHaveBeenCalledTimes(1);
            expect(mockTaxCalcService.calculate).toHaveBeenCalledWith(expect.objectContaining({
                costCenterId: 'cc-1',
                grossAmount: 5000,
                mesReferenciaNota: '2026-03'
            }));
            expect(Repository.update).toHaveBeenCalledWith(mockEntity, 'ord-1', expect.objectContaining({
                taxAmount: 500,
                tax_engine_used: true,
                irpj_adicional_amount: 100
            }));
        });

        it('deve retornar 0 recalculadas quando nenhuma ordem se qualifica', async () => {
            const orders = [
                { id: 'ord-1', tax_engine_used: 0, status: 'Pendente', costCenterId: 'cc-1', invoiceAmount: 5000 },
                { id: 'ord-2', tax_engine_used: 1, status: 'Pago', costCenterId: 'cc-2', invoiceAmount: 3000 },
            ];
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({ data: orders });

            const result = await service.recalculateAllTaxes();

            expect(result.recalculated).toBe(0);
            expect(result.errors).toEqual([]);
            expect(mockTaxCalcService.calculate).not.toHaveBeenCalled();
        });

        it('deve capturar erros de calculo e continuar processando', async () => {
            const orders = [
                { id: 'ord-1', tax_engine_used: 1, status: 'Pendente', costCenterId: 'cc-1', invoiceAmount: 5000, expectedPaymentMonth: '2026-03' },
                { id: 'ord-2', tax_engine_used: 1, status: 'Pendente', costCenterId: 'cc-2', invoiceAmount: 3000, expectedPaymentMonth: '2026-03' },
            ];
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({ data: orders });
            (Repository.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
            mockTaxCalcService.calculate
                .mockRejectedValueOnce(new Error('Falha no calculo'))
                .mockResolvedValueOnce({
                    totalDeductions: 200,
                    deductions: [{ name: 'ISS', amount: 200 }]
                });

            const result = await service.recalculateAllTaxes();

            expect(result.recalculated).toBe(1);
            expect(result.errors.length).toBe(1);
            expect(result.errors[0]).toContain('ord-1');
            expect(result.errors[0]).toContain('Falha no calculo');
        });

        it('deve ignorar ordens sem costCenterId ou com invoiceAmount <= 0', async () => {
            const orders = [
                { id: 'ord-1', tax_engine_used: 1, status: 'Pendente', costCenterId: '', invoiceAmount: 5000, expectedPaymentMonth: '2026-03' },
                { id: 'ord-2', tax_engine_used: 1, status: 'Pendente', costCenterId: 'cc-2', invoiceAmount: 0, expectedPaymentMonth: '2026-03' },
            ];
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({ data: orders });

            const result = await service.recalculateAllTaxes();

            expect(result.recalculated).toBe(0);
            expect(mockTaxCalcService.calculate).not.toHaveBeenCalled();
        });

        it('deve tratar lista vazia de ordens', async () => {
            (Repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

            const result = await service.recalculateAllTaxes();

            expect(result.recalculated).toBe(0);
            expect(result.errors).toEqual([]);
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
            service = new PaymentOrdersService({} as any);
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
                'ord-1,partner-1,BRL,cc-1,1000,100,0,2025-01-15,2025-01,,,Pendente,,,,,\n';
            (Repository.findOne as ReturnType<typeof vi.fn>).mockImplementation((_entity: unknown, criteria: { id?: string }) => {
                if (criteria?.id === 'ord-1') return Promise.resolve({ id: 'ord-1' });
                if (criteria?.id === 'partner-1') return Promise.resolve({ id: 'partner-1' });
                if (criteria?.id === 'cc-1') return Promise.resolve({ id: 'cc-1' });
                return Promise.resolve(null);
            });
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
