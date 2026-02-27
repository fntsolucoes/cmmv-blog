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

const mockEntity = (name: string) => ({ name });

function setupEntityMock(entityMap: Record<string, any>) {
    (Repository.getEntity as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
        return mockEntity(name);
    });
}

function setupFindAllMock(dataMap: Record<string, any>) {
    (Repository.findAll as ReturnType<typeof vi.fn>).mockImplementation((entity: any, filters: any) => {
        const key = entity?.name || '';
        if (dataMap[key]) {
            if (typeof dataMap[key] === 'function') return dataMap[key](filters);
            return { data: dataMap[key] };
        }
        return { data: [] };
    });
}

describe('ProfitSharingService', () => {
    let service: ProfitSharingService;

    beforeEach(() => {
        vi.clearAllMocks();
        setupEntityMock({});
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
            setupFindAllMock({
                SasPaymentOrdersEntity: ordersInMonth,
                SasCommercialPartnersEntity: []
            });

            const result = await service.getMonthlyOrders(2025, 3);

            expect(Repository.getEntity).toHaveBeenCalledWith('SasPaymentOrdersEntity');
            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe('o1');
        });

        it('deve retornar array vazio quando nao ha ordens no banco', async () => {
            setupFindAllMock({ SasPaymentOrdersEntity: [] });

            const result = await service.getMonthlyOrders(2025, 1);
            expect(result.data).toEqual([]);
        });

        it('deve filtrar ordens fora do mes (effectivePaymentDate em outro mes)', async () => {
            const allOrders = [
                { id: 'o1', status: 'Pago', effectivePaymentDate: '2025-02-10T12:00:00.000Z' },
                { id: 'o2', status: 'Pago', effectivePaymentDate: '2025-04-10T12:00:00.000Z' }
            ];
            setupFindAllMock({
                SasPaymentOrdersEntity: allOrders,
                SasCommercialPartnersEntity: []
            });

            const result = await service.getMonthlyOrders(2025, 3);
            expect(result.data).toHaveLength(0);
        });
    });

    describe('calculateIrpjAdicionalConsolidado', () => {
        const ccLucroPresumido = {
            id: 'cc-lp-1',
            name: 'Empresa LP',
            tax_regime_id: 'reg-presumido',
            is_mei_optant: false,
            fiscal_profile: JSON.stringify({ personType: 'PJ', presumptionRate: 32 }),
            cnpjDetails: JSON.stringify({ regimeStartDate: '2024-01-01' })
        };

        const ccLPSemDataInicio = {
            id: 'cc-lp-2',
            name: 'Empresa LP Sem Data',
            tax_regime_id: 'reg-presumido',
            is_mei_optant: false,
            fiscal_profile: JSON.stringify({ personType: 'PJ', presumptionRate: 32 })
        };

        const ccSimples = {
            id: 'cc-simples',
            name: 'Empresa Simples',
            tax_regime_id: 'reg-simples',
            is_mei_optant: false
        };

        const regimes = [
            { id: 'reg-presumido', code: 'LUCRO_PRESUMIDO', name: 'Lucro Presumido' },
            { id: 'reg-simples', code: 'SIMPLES_NACIONAL', name: 'Simples Nacional' }
        ];

        const irpjRule = { id: 'rule-adicional-irpj', tax_name: 'ADICIONAL_IRPJ', percentage: 10, min_threshold: 20000, active: true };

        function setupMocks() {
            setupEntityMock({});
            (Repository.findAll as ReturnType<typeof vi.fn>).mockImplementation((entity: any) => {
                const name = entity?.name || '';
                if (name === 'SasTaxRegimesEntity') return { data: regimes };
                return { data: [] };
            });
            (Repository.findOne as ReturnType<typeof vi.fn>).mockImplementation((entity: any, filters: any) => {
                const name = entity?.name || '';
                if (name === 'SasTaxRulesEntity' && filters?.tax_name === 'ADICIONAL_IRPJ') return irpjRule;
                return null;
            });
        }

        it('deve retornar zeros quando nao ha CCs lucro presumido', async () => {
            setupMocks();
            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 1, [], [], [ccSimples]
            );
            expect(result.grossLucroPresumido).toBe(0);
            expect(result.presumidoMensal).toBe(0);
            expect(result.irpjAdicionalMensalCalculado).toBe(0);
            expect(result.ajusteFinalTrimestre).toBe(0);
            expect(result.costCentersLucroPresumido).toHaveLength(0);
        });

        it('deve calcular IRPJ adicional mensal quando presumido excede R$ 20.000', async () => {
            setupMocks();

            // Bruto = 100.000, presumido = 100.000 * 0.32 = 32.000
            // Adicional = (32.000 - 20.000) * 0.10 = 1.200
            const orders = [
                {
                    id: 'o1',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 100000,
                    irpj_adicional_amount: 500,
                    tax_engine_used: true,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                }
            ];

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 1, orders, orders, [ccLucroPresumido, ccSimples]
            );

            expect(result.grossLucroPresumido).toBe(100000);
            expect(result.presumidoMensal).toBe(32000);
            expect(result.irpjAdicionalMensalCalculado).toBe(1200);
            expect(result.irpjAdicionalJaDescontadoNoMes).toBe(500);
            expect(result.irpjAdicionalDiferencaMensal).toBe(700);
            expect(result.isQuarterEnd).toBe(false);
            expect(result.ajusteFinalTrimestre).toBe(700);
        });

        it('deve retornar zero quando presumido nao excede limite mensal', async () => {
            setupMocks();

            // Bruto = 50.000, presumido = 50.000 * 0.32 = 16.000 (< 20.000)
            const orders = [
                {
                    id: 'o1',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 50000,
                    irpj_adicional_amount: 0,
                    tax_engine_used: true,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                }
            ];

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 1, orders, orders, [ccLucroPresumido]
            );

            expect(result.presumidoMensal).toBe(16000);
            expect(result.irpjAdicionalMensalCalculado).toBe(0);
            expect(result.ajusteFinalTrimestre).toBe(0);
        });

        it('deve fazer balanco trimestral no mes 3 e cobrar diferenca quando excede R$ 60.000', async () => {
            setupMocks();

            // Trimestre Q1: jan, fev, mar
            // Bruto total trimestre = 250.000 * 3 = 750.000
            // Presumido trimestral = 750.000 * 0.32 = 240.000
            // IRPJ real = (240.000 - 60.000) * 0.10 = 18.000
            // Ja descontado = 3.000 (1.000 por mes)
            // Diferenca = 18.000 - 3.000 = 15.000
            const makeOrders = (month: number) => [{
                id: `o-m${month}`,
                costCenterId: 'cc-lp-1',
                invoiceAmount: 250000,
                irpj_adicional_amount: 1000,
                tax_engine_used: true,
                effectivePaymentDate: `2025-0${month}-15T12:00:00.000Z`
            }];

            const allOrders = [...makeOrders(1), ...makeOrders(2), ...makeOrders(3)];
            const ordersDoMes = makeOrders(3);

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 3, ordersDoMes, allOrders, [ccLucroPresumido]
            );

            expect(result.isQuarterEnd).toBe(true);
            expect(result.quarter).toBe(1);
            expect(result.grossTrimestral).toBe(750000);
            expect(result.presumidoTrimestral).toBe(240000);
            expect(result.irpjAdicionalTrimestreReal).toBe(18000);
            expect(result.irpjAdicionalJaDescontadoTrimestre).toBe(3000);
            expect(result.irpjAdicionalDiferencaTrimestre).toBe(15000);
            expect(result.ajusteFinalTrimestre).toBe(15000);
        });

        it('deve devolver retido quando presumido trimestral nao excede R$ 60.000', async () => {
            setupMocks();

            // Bruto trimestral = 50.000 * 3 = 150.000
            // Presumido = 150.000 * 0.32 = 48.000 (< 60.000)
            // IRPJ real = 0
            // Ja descontado = 300 (100 por mes, notas individuais tinham)
            // Diferenca = 0 - 300 = -300 (devolver)
            const makeOrders = (month: number) => [{
                id: `o-m${month}`,
                costCenterId: 'cc-lp-1',
                invoiceAmount: 50000,
                irpj_adicional_amount: 100,
                tax_engine_used: true,
                effectivePaymentDate: `2025-0${month}-15T12:00:00.000Z`
            }];

            const allOrders = [...makeOrders(1), ...makeOrders(2), ...makeOrders(3)];
            const ordersDoMes = makeOrders(3);

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 3, ordersDoMes, allOrders, [ccLucroPresumido]
            );

            expect(result.isQuarterEnd).toBe(true);
            expect(result.presumidoTrimestral).toBe(48000);
            expect(result.irpjAdicionalTrimestreReal).toBe(0);
            expect(result.irpjAdicionalJaDescontadoTrimestre).toBe(300);
            expect(result.irpjAdicionalDiferencaTrimestre).toBe(-300);
            expect(result.ajusteFinalTrimestre).toBe(-300);
        });

        it('deve identificar corretamente os trimestres (Q2=abr-jun, Q3=jul-set, Q4=out-dez)', async () => {
            setupMocks();

            const resultQ2 = await service.calculateIrpjAdicionalConsolidado(2025, 6, [], [], [ccLucroPresumido]);
            expect(resultQ2.isQuarterEnd).toBe(true);
            expect(resultQ2.quarter).toBe(2);
            expect(resultQ2.quarterMonths).toEqual([4, 5, 6]);

            const resultQ3 = await service.calculateIrpjAdicionalConsolidado(2025, 9, [], [], [ccLucroPresumido]);
            expect(resultQ3.isQuarterEnd).toBe(true);
            expect(resultQ3.quarter).toBe(3);
            expect(resultQ3.quarterMonths).toEqual([7, 8, 9]);

            const resultQ4 = await service.calculateIrpjAdicionalConsolidado(2025, 12, [], [], [ccLucroPresumido]);
            expect(resultQ4.isQuarterEnd).toBe(true);
            expect(resultQ4.quarter).toBe(4);
            expect(resultQ4.quarterMonths).toEqual([10, 11, 12]);

            const resultMid = await service.calculateIrpjAdicionalConsolidado(2025, 5, [], [], [ccLucroPresumido]);
            expect(resultMid.isQuarterEnd).toBe(false);
            expect(resultMid.quarter).toBe(2);
        });

        it('deve ignorar ordens de CCs que nao sao lucro presumido', async () => {
            setupMocks();

            const orders = [
                {
                    id: 'o-lp',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 100000,
                    irpj_adicional_amount: 0,
                    tax_engine_used: true,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                },
                {
                    id: 'o-simples',
                    costCenterId: 'cc-simples',
                    invoiceAmount: 200000,
                    irpj_adicional_amount: 0,
                    tax_engine_used: true,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                }
            ];

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 1, orders, orders, [ccLucroPresumido, ccSimples]
            );

            expect(result.grossLucroPresumido).toBe(100000);
            expect(result.presumidoMensal).toBe(32000);
        });

        it('deve ignorar ordens sem motor tributario (tax_engine_used)', async () => {
            setupMocks();

            const orders = [
                {
                    id: 'o-com-engine',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 100000,
                    irpj_adicional_amount: 500,
                    tax_engine_used: true,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                },
                {
                    id: 'o-sem-engine',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 200000,
                    irpj_adicional_amount: 1000,
                    tax_engine_used: false,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                },
                {
                    id: 'o-null-engine',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 300000,
                    irpj_adicional_amount: 2000,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                }
            ];

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 1, orders, orders, [ccLucroPresumido, ccSimples]
            );

            // Somente o-com-engine (100.000) deve ser somado
            expect(result.grossLucroPresumido).toBe(100000);
            expect(result.irpjAdicionalJaDescontadoNoMes).toBe(500);
        });

        it('deve ignorar ordens sem motor tributario no calculo trimestral', async () => {
            setupMocks();

            const ordersJan = [
                {
                    id: 'o-jan-ok',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 100000,
                    irpj_adicional_amount: 0,
                    tax_engine_used: true,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                },
                {
                    id: 'o-jan-sem',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 500000,
                    irpj_adicional_amount: 0,
                    tax_engine_used: false,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                }
            ];
            const ordersFev = [{
                id: 'o-fev',
                costCenterId: 'cc-lp-1',
                invoiceAmount: 100000,
                irpj_adicional_amount: 0,
                tax_engine_used: true,
                effectivePaymentDate: '2025-02-15T12:00:00.000Z'
            }];
            const ordersMar = [{
                id: 'o-mar',
                costCenterId: 'cc-lp-1',
                invoiceAmount: 100000,
                irpj_adicional_amount: 0,
                tax_engine_used: 1,
                effectivePaymentDate: '2025-03-15T12:00:00.000Z'
            }];

            const allOrders = [...ordersJan, ...ordersFev, ...ordersMar];

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 3, ordersMar, allOrders, [ccLucroPresumido]
            );

            // Trimestral: jan-ok(100k) + fev(100k) + mar(100k) = 300.000
            // jan-sem (500k, sem engine) e ignorado
            expect(result.grossTrimestral).toBe(300000);
        });

        it('deve incluir regimeStartDate no retorno dos centros de custo', async () => {
            setupMocks();
            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 1, [], [], [ccLucroPresumido]
            );
            expect(result.costCentersLucroPresumido).toHaveLength(1);
            expect(result.costCentersLucroPresumido[0].regimeStartDate).toBe('2024-01-01T00:00:00.000Z');
        });

        it('deve retornar regimeStartDate null quando nao cadastrado', async () => {
            setupMocks();
            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 1, [], [], [ccLPSemDataInicio]
            );
            expect(result.costCentersLucroPresumido).toHaveLength(1);
            expect(result.costCentersLucroPresumido[0].regimeStartDate).toBeNull();
        });

        it('deve excluir ordens anteriores a data de inicio do regime', async () => {
            setupMocks();

            // CC tem regimeStartDate = 2024-01-01
            // Ordem de 2023-12 (anterior) deve ser ignorada
            // Ordem de 2025-01 (posterior) deve ser somada
            const orders = [
                {
                    id: 'o-antes',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 200000,
                    irpj_adicional_amount: 0,
                    tax_engine_used: true,
                    effectivePaymentDate: '2023-12-15T12:00:00.000Z'
                },
                {
                    id: 'o-depois',
                    costCenterId: 'cc-lp-1',
                    invoiceAmount: 100000,
                    irpj_adicional_amount: 0,
                    tax_engine_used: true,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                }
            ];

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 1, orders, orders, [ccLucroPresumido]
            );

            // Somente o-depois deve ser somado (100.000)
            expect(result.grossLucroPresumido).toBe(100000);
            expect(result.presumidoMensal).toBe(32000);
        });

        it('deve incluir todas as ordens quando regimeStartDate nao esta cadastrado', async () => {
            setupMocks();

            const orders = [
                {
                    id: 'o1',
                    costCenterId: 'cc-lp-2',
                    invoiceAmount: 100000,
                    irpj_adicional_amount: 0,
                    tax_engine_used: true,
                    effectivePaymentDate: '2020-01-15T12:00:00.000Z'
                },
                {
                    id: 'o2',
                    costCenterId: 'cc-lp-2',
                    invoiceAmount: 50000,
                    irpj_adicional_amount: 0,
                    tax_engine_used: true,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                }
            ];

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 1, orders, orders, [ccLPSemDataInicio]
            );

            // Sem data de inicio, todas devem ser somadas
            expect(result.grossLucroPresumido).toBe(150000);
        });

        it('deve filtrar ordens anteriores ao regime tambem no calculo trimestral', async () => {
            setupMocks();

            // CC com regimeStartDate = 2025-02-01 (fev/2025)
            const ccComInicioFev = {
                ...ccLucroPresumido,
                cnpjDetails: JSON.stringify({ regimeStartDate: '2025-02-01' })
            };

            // Q1: jan, fev, mar
            // Jan tem ordens mas sao ANTES do inicio do regime -> ignorar
            // Fev e Mar sao DEPOIS -> somar
            const ordersJan = [{
                id: 'o-jan',
                costCenterId: 'cc-lp-1',
                invoiceAmount: 500000,
                irpj_adicional_amount: 0,
                tax_engine_used: true,
                effectivePaymentDate: '2025-01-15T12:00:00.000Z'
            }];
            const ordersFev = [{
                id: 'o-fev',
                costCenterId: 'cc-lp-1',
                invoiceAmount: 100000,
                irpj_adicional_amount: 0,
                tax_engine_used: true,
                effectivePaymentDate: '2025-02-15T12:00:00.000Z'
            }];
            const ordersMar = [{
                id: 'o-mar',
                costCenterId: 'cc-lp-1',
                invoiceAmount: 100000,
                irpj_adicional_amount: 0,
                tax_engine_used: true,
                effectivePaymentDate: '2025-03-15T12:00:00.000Z'
            }];

            const allOrders = [...ordersJan, ...ordersFev, ...ordersMar];

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 3, ordersMar, allOrders, [ccComInicioFev]
            );

            // Trimestral: jan ignorado (antes do regime), fev + mar = 200.000
            expect(result.grossTrimestral).toBe(200000);
            expect(result.presumidoTrimestral).toBe(64000);
        });

        it('deve abater irpj_adicional_amount ja descontado nas notas do trimestre', async () => {
            setupMocks();

            // 3 meses com bruto alto e IRPJ ja descontado de 5.000 cada
            const makeOrders = (month: number) => [{
                id: `o-m${month}`,
                costCenterId: 'cc-lp-1',
                invoiceAmount: 300000,
                irpj_adicional_amount: 5000,
                tax_engine_used: true,
                effectivePaymentDate: `2025-0${month}-15T12:00:00.000Z`
            }];

            const allOrders = [...makeOrders(1), ...makeOrders(2), ...makeOrders(3)];
            const ordersDoMes = makeOrders(3);

            const result = await service.calculateIrpjAdicionalConsolidado(
                2025, 3, ordersDoMes, allOrders, [ccLucroPresumido]
            );

            // Bruto = 900.000, Presumido = 288.000
            // IRPJ real = (288.000 - 60.000) * 0.10 = 22.800
            // Ja descontado = 15.000
            // Diferenca = 22.800 - 15.000 = 7.800
            expect(result.irpjAdicionalJaDescontadoTrimestre).toBe(15000);
            expect(result.irpjAdicionalTrimestreReal).toBe(22800);
            expect(result.irpjAdicionalDiferencaTrimestre).toBe(7800);
            expect(result.ajusteFinalTrimestre).toBe(7800);
        });
    });

    describe('calculateMonthlyProfitSharing', () => {
        const ccLucroPresumido = {
            id: 'cc-lp-1',
            name: 'Empresa LP',
            tax_regime_id: 'reg-presumido',
            is_mei_optant: false,
            fiscal_profile: JSON.stringify({ personType: 'PJ', presumptionRate: 32 }),
            cnpjDetails: JSON.stringify({ regimeStartDate: '2024-01-01' })
        };

        const regimes = [
            { id: 'reg-presumido', code: 'LUCRO_PRESUMIDO', name: 'Lucro Presumido' }
        ];

        const irpjRule = { id: 'rule-adicional-irpj', tax_name: 'ADICIONAL_IRPJ', percentage: 10, min_threshold: 20000, active: true };

        it('deve incluir irpjAdicional no resultado e ajustar totalBRL', async () => {
            setupEntityMock({});

            const orders = [
                {
                    id: 'o1',
                    status: 'Pago',
                    costCenterId: 'cc-lp-1',
                    commercialPartnerId: 'p1',
                    currency: 'BRL',
                    invoiceAmount: 100000,
                    taxAmount: 5000,
                    discountAmount: 0,
                    paidValue: 95000,
                    irpj_adicional_amount: 500,
                    tax_engine_used: true,
                    effectivePaymentDate: '2025-01-15T12:00:00.000Z'
                }
            ];

            const shareholders = [
                { id: 's1', name: 'Socio A', percentage: 50, active: true },
                { id: 's2', name: 'Socio B', percentage: 50, active: true }
            ];

            (Repository.findAll as ReturnType<typeof vi.fn>).mockImplementation((entity: any, filters: any) => {
                const name = entity?.name || '';
                if (name === 'SasPaymentOrdersEntity') return { data: orders };
                if (name === 'SasShareholdersEntity') return { data: shareholders };
                if (name === 'SasCostCentersEntity') return { data: [ccLucroPresumido] };
                if (name === 'SasTaxRegimesEntity') return { data: regimes };
                if (name === 'SasExchangeRatesEntity') return { data: [] };
                return { data: [] };
            });
            (Repository.findOne as ReturnType<typeof vi.fn>).mockImplementation((entity: any, filters: any) => {
                const name = entity?.name || '';
                if (name === 'SasTaxRulesEntity' && filters?.tax_name === 'ADICIONAL_IRPJ') return irpjRule;
                return null;
            });

            const result = await service.calculateMonthlyProfitSharing(2025, 1);

            expect(result.irpjAdicional).toBeDefined();
            expect(result.irpjAdicional.grossLucroPresumido).toBe(100000);
            expect(result.irpjAdicional.presumidoMensal).toBe(32000);
            // Adicional = (32000 - 20000) * 0.10 = 1200
            expect(result.irpjAdicional.irpjAdicionalMensalCalculado).toBe(1200);
            // Diferenca = 1200 - 500 = 700
            expect(result.irpjAdicional.ajusteFinalTrimestre).toBe(700);
            // totalBRL = 95000 - 700 = 94300
            expect(result.totalBRL).toBe(94300);
            expect(result.distribution).toHaveLength(2);
            expect(result.distribution[0].amount).toBe(47150);
        });
    });
});
