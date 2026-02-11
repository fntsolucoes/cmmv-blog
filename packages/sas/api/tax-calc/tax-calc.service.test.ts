import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes unitarios para o TaxCalcService - foco no Simples Nacional.
 *
 * Os metodos privados sao acessados via cast (service as any) para validar
 * a logica interna de parsing, extracao de anexo e calculo DAS.
 */

// ---------- Mocks globais ----------

// Mock do decorator @Service
vi.mock("@cmmv/core", () => ({
    Service: () => (target: any) => target,
}));

// Mock do Repository (sera configurado em cada teste)
const mockGetEntity = vi.fn().mockReturnValue("MockEntity");
const mockFindOne = vi.fn().mockResolvedValue(null);
const mockFindAll = vi.fn().mockResolvedValue({ data: [] });

vi.mock("@cmmv/repository", () => ({
    Repository: {
        getEntity: (...args: any[]) => mockGetEntity(...args),
        findOne: (...args: any[]) => mockFindOne(...args),
        findAll: (...args: any[]) => mockFindAll(...args),
    },
}));

// Import apos mocks
import { TaxCalcService } from "./tax-calc.service";

// ---------- Helpers ----------

function createService(): TaxCalcService {
    return new TaxCalcService();
}

// Dados de faixas do Anexo III para mock
const BRACKETS_ANEXO_III = [
    { annex_code: "III", faixa: 1, rbt12_limit: 180000, nominal_rate_percent: 6.00, parcel_to_deduct: 0 },
    { annex_code: "III", faixa: 2, rbt12_limit: 360000, nominal_rate_percent: 11.20, parcel_to_deduct: 9360 },
    { annex_code: "III", faixa: 3, rbt12_limit: 720000, nominal_rate_percent: 13.50, parcel_to_deduct: 17640 },
    { annex_code: "III", faixa: 4, rbt12_limit: 1800000, nominal_rate_percent: 16.00, parcel_to_deduct: 35640 },
    { annex_code: "III", faixa: 5, rbt12_limit: 3600000, nominal_rate_percent: 21.00, parcel_to_deduct: 125640 },
    { annex_code: "III", faixa: 6, rbt12_limit: 4800000, nominal_rate_percent: 33.00, parcel_to_deduct: 648000 },
];

const BRACKETS_ANEXO_V = [
    { annex_code: "V", faixa: 1, rbt12_limit: 180000, nominal_rate_percent: 15.50, parcel_to_deduct: 0 },
    { annex_code: "V", faixa: 2, rbt12_limit: 360000, nominal_rate_percent: 18.00, parcel_to_deduct: 4500 },
    { annex_code: "V", faixa: 3, rbt12_limit: 720000, nominal_rate_percent: 19.50, parcel_to_deduct: 9900 },
    { annex_code: "V", faixa: 4, rbt12_limit: 1800000, nominal_rate_percent: 20.50, parcel_to_deduct: 17100 },
    { annex_code: "V", faixa: 5, rbt12_limit: 3600000, nominal_rate_percent: 23.00, parcel_to_deduct: 62100 },
    { annex_code: "V", faixa: 6, rbt12_limit: 4800000, nominal_rate_percent: 30.50, parcel_to_deduct: 540000 },
];

const BRACKETS_ANEXO_I = [
    { annex_code: "I", faixa: 1, rbt12_limit: 180000, nominal_rate_percent: 4.00, parcel_to_deduct: 0 },
    { annex_code: "I", faixa: 2, rbt12_limit: 360000, nominal_rate_percent: 7.30, parcel_to_deduct: 5940 },
];

// ---------- Suite ----------

describe("TaxCalcService", () => {
    let service: TaxCalcService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = createService();
    });

    // ==========================================
    // parseCnpjDetails
    // ==========================================
    describe("parseCnpjDetails", () => {
        it("retorna parsed JSON quando costCenter tem cnpjDetails (camelCase string)", () => {
            const cc = { cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo III" }) };
            const result = (service as any).parseCnpjDetails(cc);
            expect(result).toEqual({ simplesAnexo: "Anexo III" });
        });

        it("retorna parsed JSON quando costCenter tem cnpj_details (snake_case string)", () => {
            const cc = { cnpj_details: JSON.stringify({ simplesAnexo: "Anexo V" }) };
            const result = (service as any).parseCnpjDetails(cc);
            expect(result).toEqual({ simplesAnexo: "Anexo V" });
        });

        it("prefere cnpjDetails sobre cnpj_details quando ambos existem", () => {
            const cc = {
                cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo I" }),
                cnpj_details: JSON.stringify({ simplesAnexo: "Anexo II" }),
            };
            const result = (service as any).parseCnpjDetails(cc);
            expect(result).toEqual({ simplesAnexo: "Anexo I" });
        });

        it("retorna objeto direto se cnpjDetails ja e um objeto", () => {
            const cc = { cnpjDetails: { simplesAnexo: "Anexo IV" } };
            const result = (service as any).parseCnpjDetails(cc);
            expect(result).toEqual({ simplesAnexo: "Anexo IV" });
        });

        it("retorna null se nenhum campo existe", () => {
            const result = (service as any).parseCnpjDetails({});
            expect(result).toBeNull();
        });

        it("retorna null se cnpjDetails e JSON invalido", () => {
            const cc = { cnpjDetails: "not-json{" };
            const result = (service as any).parseCnpjDetails(cc);
            expect(result).toBeNull();
        });
    });

    // ==========================================
    // extractAnnexCode
    // ==========================================
    describe("extractAnnexCode", () => {
        it('converte "Anexo III" para "III"', () => {
            expect((service as any).extractAnnexCode("Anexo III")).toBe("III");
        });

        it('converte "Anexo I" para "I"', () => {
            expect((service as any).extractAnnexCode("Anexo I")).toBe("I");
        });

        it('converte "anexo v" (minusculo) para "V"', () => {
            expect((service as any).extractAnnexCode("anexo v")).toBe("V");
        });

        it('preserva "III" sem prefixo', () => {
            expect((service as any).extractAnnexCode("III")).toBe("III");
        });

        it('preserva "I" sem prefixo', () => {
            expect((service as any).extractAnnexCode("I")).toBe("I");
        });

        it("retorna string vazia para null/undefined", () => {
            expect((service as any).extractAnnexCode(null)).toBe("");
            expect((service as any).extractAnnexCode(undefined)).toBe("");
            expect((service as any).extractAnnexCode("")).toBe("");
        });

        it('remove apenas o prefixo ANEXO com espaco', () => {
            expect((service as any).extractAnnexCode("  Anexo IV  ")).toBe("IV");
        });
    });

    // ==========================================
    // getSimplesAnnex
    // ==========================================
    describe("getSimplesAnnex", () => {
        it('retorna "III" quando cnpjDetails tem "Anexo III"', () => {
            const cc = { cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo III" }) };
            expect((service as any).getSimplesAnnex(cc)).toBe("III");
        });

        it('retorna "I" quando cnpjDetails tem "Anexo I"', () => {
            const cc = { cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo I" }) };
            expect((service as any).getSimplesAnnex(cc)).toBe("I");
        });

        it('retorna "V" quando cnpjDetails tem "Anexo V"', () => {
            const cc = { cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo V" }) };
            expect((service as any).getSimplesAnnex(cc)).toBe("V");
        });

        it("retorna vazio quando cnpjDetails nao tem simplesAnexo", () => {
            const cc = { cnpjDetails: JSON.stringify({}) };
            expect((service as any).getSimplesAnnex(cc)).toBe("");
        });

        it("retorna vazio quando costCenter nao tem cnpjDetails", () => {
            expect((service as any).getSimplesAnnex({})).toBe("");
        });
    });

    // ==========================================
    // getSimplesBracket
    // ==========================================
    describe("getSimplesBracket", () => {
        it("encontra faixa 1 para RBT12 = 100.000", async () => {
            mockFindAll.mockResolvedValue({ data: BRACKETS_ANEXO_III });

            const result = await (service as any).getSimplesBracket("III", 100000);
            expect(result).not.toBeNull();
            expect(result!.nominal_rate_percent).toBe(6.00);
            expect(result!.parcel_to_deduct).toBe(0);
        });

        it("encontra faixa 5 para RBT12 = 3.121.577 (caso do usuario)", async () => {
            mockFindAll.mockResolvedValue({ data: BRACKETS_ANEXO_III });

            const result = await (service as any).getSimplesBracket("III", 3121577.33);
            expect(result).not.toBeNull();
            expect(result!.nominal_rate_percent).toBe(21.00);
            expect(result!.parcel_to_deduct).toBe(125640);
        });

        it("usa ultima faixa se RBT12 ultrapassa todas", async () => {
            mockFindAll.mockResolvedValue({ data: BRACKETS_ANEXO_III });

            const result = await (service as any).getSimplesBracket("III", 5000000);
            expect(result).not.toBeNull();
            expect(result!.nominal_rate_percent).toBe(33.00);
            expect(result!.parcel_to_deduct).toBe(648000);
        });

        it("retorna null para annex_code vazio", async () => {
            const result = await (service as any).getSimplesBracket("", 100000);
            expect(result).toBeNull();
        });

        it("retorna null para rbt12 <= 0", async () => {
            const result = await (service as any).getSimplesBracket("III", 0);
            expect(result).toBeNull();
        });

        it("retorna null se nao ha dados de faixas", async () => {
            mockFindAll.mockResolvedValue({ data: [] });

            const result = await (service as any).getSimplesBracket("III", 100000);
            expect(result).toBeNull();
        });
    });

    // ==========================================
    // getSimplesNacionalDas (calculo completo)
    // ==========================================
    describe("getSimplesNacionalDas", () => {
        it("calcula DAS corretamente para Anexo III, faixa 1 (RBT12 = 100.000)", async () => {
            const cc = { cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo III" }) };
            const gross = 10000;

            const revenueData: any[] = [];
            for (let i = 1; i <= 12; i++) {
                revenueData.push({
                    cost_center_id: "cc-1",
                    year: 2025,
                    month: i,
                    gross_revenue: 8333.33,
                });
            }

            // findAll: 1 = Revenue (getRBT12), 2 = Payment orders (getMonthlyRevenueByAnnex), 3 = Brackets (getSimplesBracket fallback)
            let callCount = 0;
            mockFindAll.mockImplementation(async () => {
                callCount++;
                if (callCount === 1) return { data: revenueData }; // Revenue
                if (callCount === 2) return { data: [] }; // Payment orders (vazio)
                if (callCount === 3) return { data: BRACKETS_ANEXO_III }; // Brackets
                return { data: [] };
            });

            const result = await (service as any).getSimplesNacionalDas(cc, "cc-1", gross, "2026-02");

            expect(result).not.toBeNull();
            // RBT12 = 12 * 8333.33 = 99999.96
            // Faixa 1 (rbt12 <= 180000): nominal = 6%, PD = 0
            // Aliquota efetiva = ((99999.96 * 0.06) - 0) / 99999.96 = 6%
            // Imposto = 10000 * 0.06 = 600
            expect(result!.percent).toBeCloseTo(6.0, 1);
            expect(result!.amount).toBeCloseTo(600, 0);
        });

        it("calcula DAS para Anexo III faixa 5 (RBT12 = 3.121.577 - caso real)", async () => {
            const cc = { cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo III" }) };
            const gross = 50000;

            // 12 meses de ~260.131 cada -> RBT12 = 3.121.577.33
            const revenueData: any[] = [];
            for (let i = 1; i <= 12; i++) {
                revenueData.push({
                    cost_center_id: "cc-1",
                    year: 2025,
                    month: i,
                    gross_revenue: 260131.44,
                });
            }

            let callCount = 0;
            mockFindAll.mockImplementation(async () => {
                callCount++;
                if (callCount === 1) return { data: revenueData }; // Revenue
                if (callCount === 2) return { data: [] }; // Payment orders
                if (callCount === 3) return { data: BRACKETS_ANEXO_III }; // Brackets
                return { data: [] };
            });

            const result = await (service as any).getSimplesNacionalDas(cc, "cc-1", gross, "2026-02");

            expect(result).not.toBeNull();
            // RBT12 = 3121577.28 (12 * 260131.44)
            // Faixa 5 (rbt12 <= 3600000): nominal = 21%, PD = 125640
            // Efetiva = ((3121577.28 * 0.21) - 125640) / 3121577.28
            //         = (655531.23 - 125640) / 3121577.28
            //         = 529891.23 / 3121577.28
            //         = ~16.97%
            expect(result!.percent).toBeGreaterThan(16);
            expect(result!.percent).toBeLessThan(18);
            expect(result!.amount).toBeGreaterThan(0);
        });

        it("retorna null quando nao tem cnpjDetails (sem Anexo)", async () => {
            const cc = {};
            const result = await (service as any).getSimplesNacionalDas(cc, "cc-1", 10000, "2026-02");
            expect(result).toBeNull();
        });

        it("retorna null quando RBT12 = 0 (sem faturamento cadastrado)", async () => {
            const cc = { cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo III" }) };

            mockFindAll.mockResolvedValue({ data: [] }); // sem faturamento

            const result = await (service as any).getSimplesNacionalDas(cc, "cc-1", 10000, "2026-02");
            expect(result).toBeNull();
        });

        it("calcula DAS para Anexo V faixa 2 com parcela a deduzir", async () => {
            const cc = { cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo V" }) };
            const gross = 15000;

            const revenueData: any[] = [];
            for (let i = 1; i <= 12; i++) {
                revenueData.push({
                    cost_center_id: "cc-1",
                    year: 2025,
                    month: i,
                    gross_revenue: 25000,
                });
            }

            let callCount = 0;
            mockFindAll.mockImplementation(async () => {
                callCount++;
                if (callCount === 1) return { data: revenueData }; // Revenue
                if (callCount === 2) return { data: [] }; // Payment orders
                if (callCount === 3) return { data: BRACKETS_ANEXO_V }; // Brackets
                return { data: [] };
            });

            const result = await (service as any).getSimplesNacionalDas(cc, "cc-1", gross, "2026-02");

            expect(result).not.toBeNull();
            // RBT12 = 300000
            // Faixa 2 (300000 <= 360000): nominal = 18%, PD = 4500
            // Efetiva = ((300000 * 0.18) - 4500) / 300000 = 49500/300000 = 16.50%
            expect(result!.percent).toBeCloseTo(16.50, 1);
            expect(result!.amount).toBeCloseTo(2475, 0);
        });
    });

    // ==========================================
    // calculate (integracao Simples Nacional)
    // ==========================================
    describe("calculate - Simples Nacional", () => {
        it("retorna DAS calculado para empresa Simples Nacional com dados completos", async () => {
            const costCenterId = "cc-godan";
            const gross = 10000;

            const costCenter = {
                id: costCenterId,
                tax_regime_id: "reg-simples",
                is_mei_optant: false,
                fiscal_profile: JSON.stringify({ personType: "PJ" }),
                cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo III" }),
            };

            const regime = { id: "reg-simples", code: "SIMPLES_NACIONAL" };

            const revenueItems: any[] = [];
            for (let i = 1; i <= 12; i++) {
                revenueItems.push({ cost_center_id: costCenterId, year: 2025, month: i, gross_revenue: 10000 });
            }

            mockGetEntity.mockReturnValue("MockEntity");

            mockFindOne.mockImplementation(async (_entity: any, query: any) => {
                if (query.id === costCenterId) return costCenter;
                if (query.id === "reg-simples") return regime;
                return null;
            });

            // findAll: Revenue, Payment orders, Brackets
            let findAllCallIndex = 0;
            mockFindAll.mockImplementation(async () => {
                findAllCallIndex++;
                if (findAllCallIndex === 1) return { data: revenueItems }; // Revenue
                if (findAllCallIndex === 2) return { data: [] }; // Payment orders
                if (findAllCallIndex === 3) return { data: BRACKETS_ANEXO_III }; // Brackets
                return { data: [] };
            });

            const result = await service.calculate({
                costCenterId,
                grossAmount: gross,
                referenceMonth: "2026-02",
            });

            expect(result.gross).toBe(gross);
            expect(result.deductions.length).toBeGreaterThan(0);

            const das = result.deductions.find((d) => d.name.includes("DAS"));
            expect(das).toBeDefined();
            expect(das!.amount).toBeGreaterThan(0);

            // RBT12 = 120000, Faixa 1 (<=180000): nominal 6%, PD 0
            // Efetiva = 6% -> DAS = 10000 * 0.06 = 600
            expect(das!.percent).toBeCloseTo(6.0, 1);
            expect(das!.amount).toBeCloseTo(600, 0);
            expect(result.totalDeductions).toBeCloseTo(600, 0);
            expect(result.liquid).toBeCloseTo(9400, 0);
        });

        it("retorna hint quando falta anexo", async () => {
            const costCenterId = "cc-sem-anexo";

            const costCenter = {
                id: costCenterId,
                tax_regime_id: "reg-simples",
                is_mei_optant: false,
                fiscal_profile: JSON.stringify({ personType: "PJ" }),
                cnpjDetails: JSON.stringify({}), // sem simplesAnexo
            };

            const regime = { id: "reg-simples", code: "SIMPLES_NACIONAL" };

            mockFindOne.mockImplementation(async (_entity: any, query: any) => {
                if (query.id === costCenterId) return costCenter;
                if (query.id === "reg-simples") return regime;
                return null;
            });

            const result = await service.calculate({
                costCenterId,
                grossAmount: 5000,
                referenceMonth: "2026-02",
            });

            const das = result.deductions.find((d) => d.name.includes("DAS"));
            expect(das).toBeDefined();
            expect(das!.amount).toBe(0);
            expect(das!.name).toContain("Cadastre o Anexo");
        });

        it("retorna hint quando falta faturamento mensal", async () => {
            const costCenterId = "cc-sem-revenue";

            const costCenter = {
                id: costCenterId,
                tax_regime_id: "reg-simples",
                is_mei_optant: false,
                fiscal_profile: JSON.stringify({ personType: "PJ" }),
                cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo III" }),
            };

            const regime = { id: "reg-simples", code: "SIMPLES_NACIONAL" };

            mockFindOne.mockImplementation(async (_entity: any, query: any) => {
                if (query.id === costCenterId) return costCenter;
                if (query.id === "reg-simples") return regime;
                return null;
            });

            mockFindAll.mockResolvedValue({ data: [] }); // sem faturamento

            const result = await service.calculate({
                costCenterId,
                grossAmount: 5000,
                referenceMonth: "2026-02",
            });

            const das = result.deductions.find((d) => d.name.includes("DAS"));
            expect(das).toBeDefined();
            expect(das!.amount).toBe(0);
            expect(das!.name).toContain("faturamento mensal");
        });

        it("funciona com snake_case cnpj_details", async () => {
            const costCenterId = "cc-snake";

            const costCenter = {
                id: costCenterId,
                tax_regime_id: "reg-simples",
                is_mei_optant: false,
                fiscal_profile: JSON.stringify({ personType: "PJ" }),
                cnpj_details: JSON.stringify({ simplesAnexo: "Anexo I" }), // snake_case
            };

            const regime = { id: "reg-simples", code: "SIMPLES_NACIONAL" };

            const revenueItems: any[] = [];
            for (let i = 1; i <= 12; i++) {
                revenueItems.push({ cost_center_id: costCenterId, year: 2025, month: i, gross_revenue: 15000 });
            }

            mockFindOne.mockImplementation(async (_entity: any, query: any) => {
                if (query.id === costCenterId) return costCenter;
                if (query.id === "reg-simples") return regime;
                return null;
            });

            let findAllCallIdx = 0;
            mockFindAll.mockImplementation(async () => {
                findAllCallIdx++;
                if (findAllCallIdx === 1) return { data: revenueItems }; // Revenue
                if (findAllCallIdx === 2) return { data: [] }; // Payment orders
                if (findAllCallIdx === 3) return { data: BRACKETS_ANEXO_I }; // Brackets
                return { data: [] };
            });

            const result = await service.calculate({
                costCenterId,
                grossAmount: 8000,
                referenceMonth: "2026-02",
            });

            const das = result.deductions.find((d) => d.name.includes("DAS"));
            expect(das).toBeDefined();
            expect(das!.amount).toBeGreaterThan(0);
            // RBT12 = 180000, Faixa 1 (<=180000): 4%, PD=0 -> efetiva 4%
            // DAS = 8000 * 0.04 = 320
            expect(das!.percent).toBeCloseTo(4.0, 1);
            expect(das!.amount).toBeCloseTo(320, 0);
        });

        it("calcula corretamente para RBT12 alto (caso Godan R$ 3.121.577)", async () => {
            const costCenterId = "cc-godan-alto";
            const gross = 50000;

            const costCenter = {
                id: costCenterId,
                tax_regime_id: "reg-simples",
                is_mei_optant: false,
                fiscal_profile: JSON.stringify({ personType: "PJ" }),
                cnpjDetails: JSON.stringify({ simplesAnexo: "Anexo III" }),
            };

            const regime = { id: "reg-simples", code: "SIMPLES_NACIONAL" };

            // 12 meses de ~260.131 = RBT12 ~3.121.577
            const revenueItems: any[] = [];
            for (let i = 1; i <= 12; i++) {
                revenueItems.push({ cost_center_id: costCenterId, year: 2025, month: i, gross_revenue: 260131.44 });
            }

            mockFindOne.mockImplementation(async (_entity: any, query: any) => {
                if (query.id === costCenterId) return costCenter;
                if (query.id === "reg-simples") return regime;
                return null;
            });

            let findAllIdx = 0;
            mockFindAll.mockImplementation(async () => {
                findAllIdx++;
                if (findAllIdx === 1) return { data: revenueItems }; // Revenue
                if (findAllIdx === 2) return { data: [] }; // Payment orders
                if (findAllIdx === 3) return { data: BRACKETS_ANEXO_III }; // Brackets
                return { data: [] };
            });

            const result = await service.calculate({
                costCenterId,
                grossAmount: gross,
                referenceMonth: "2026-02",
            });

            const das = result.deductions.find((d) => d.name === "DAS (Simples Nacional)");
            expect(das).toBeDefined();
            expect(das!.amount).toBeGreaterThan(0);
            // RBT12 ~3121577.28, Faixa 5: nominal 21%, PD 125640
            // Efetiva ~16.97%
            expect(das!.percent).toBeGreaterThan(16);
            expect(das!.percent).toBeLessThan(18);
        });
    });

    // ==========================================
    // getRBT12
    // ==========================================
    describe("getRBT12", () => {
        it("calcula soma de 12 meses completos", async () => {
            const items: any[] = [];
            for (let i = 1; i <= 12; i++) {
                items.push({ cost_center_id: "cc-1", year: 2025, month: i, gross_revenue: 10000 });
            }
            mockFindAll.mockResolvedValue({ data: items });

            const rbt12 = await (service as any).getRBT12("cc-1", "2026-01");
            expect(rbt12).toBe(120000);
        });

        it("projeta empresa nova (6 meses -> media * 12)", async () => {
            const items: any[] = [];
            for (let i = 7; i <= 12; i++) {
                items.push({ cost_center_id: "cc-1", year: 2025, month: i, gross_revenue: 10000 });
            }
            mockFindAll.mockResolvedValue({ data: items });

            const rbt12 = await (service as any).getRBT12("cc-1", "2026-01");
            expect(rbt12).toBe(120000);
        });

        it("retorna 0 se nao ha faturamento", async () => {
            mockFindAll.mockResolvedValue({ data: [] });
            const rbt12 = await (service as any).getRBT12("cc-1", "2026-01");
            expect(rbt12).toBe(0);
        });

        it("exclui o mes de referencia do calculo", async () => {
            const items: any[] = [
                { cost_center_id: "cc-1", year: 2026, month: 1, gross_revenue: 50000 },
                { cost_center_id: "cc-1", year: 2026, month: 2, gross_revenue: 99999 },
            ];
            mockFindAll.mockResolvedValue({ data: items });

            const rbt12 = await (service as any).getRBT12("cc-1", "2026-02");
            expect(rbt12).toBe(600000);
        });
    });

    // ==========================================
    // irrfProgressive
    // ==========================================
    describe("irrfProgressive", () => {
        it("retorna 0 para valores abaixo da primeira faixa", () => {
            const result = (service as any).irrfProgressive(2000);
            expect(result).toBe(0);
        });

        it("calcula corretamente na segunda faixa", () => {
            const result = (service as any).irrfProgressive(2500);
            expect(result).toBeCloseTo(29.10, 2);
        });
    });
});
