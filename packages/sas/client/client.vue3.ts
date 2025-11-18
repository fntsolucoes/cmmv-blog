//@ts-ignore
import { useApi } from '@cmmv/blog/admin/api';

export const useSasClient = () => {
    const api = useApi();

    const costCenters = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`sas/cost-centers?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("sas/cost-centers", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`sas/cost-centers/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`sas/cost-centers/${id}`, "DELETE");
        }
    };

    const commercialPartners = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`sas/commercial-partners?${query}`, "GET");
        },
        getAll: async () => {
            return api.authRequest(`sas/commercial-partners/all`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("sas/commercial-partners", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`sas/commercial-partners/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`sas/commercial-partners/${id}`, "DELETE");
        },
        getPaymentOrdersHistory: async (id: string) => {
            return api.authRequest(`sas/commercial-partners/${id}/payment-orders`, "GET");
        }
    };

    const campaigns = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`sas/campaigns?${query}`, "GET");
        },
        getAll: async () => {
            return api.authRequest(`sas/campaigns/all`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("sas/campaigns", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`sas/campaigns/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`sas/campaigns/${id}`, "DELETE");
        },
        getActiveByPartner: async (partnerId: string) => {
            return api.authRequest(`sas/campaigns/partner/${partnerId}/active`, "GET");
        },
        getAllByPartner: async (partnerId: string) => {
            return api.authRequest(`sas/campaigns/partner/${partnerId}/all`, "GET");
        }
    };

    const paymentOrders = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`sas/payment-orders/v2?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("sas/payment-orders/v2", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`sas/payment-orders/v2/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`sas/payment-orders/v2/${id}`, "DELETE");
        },
        updateStatus: async (id: string, data: { status: string; effectivePaymentDate?: string | Date | null; paidValue?: number | null }) => {
            return api.authRequest(`sas/payment-orders/v2/${id}/status`, "PATCH", data);
        },
        getNetAmount: async (id: string) => {
            return api.authRequest(`sas/payment-orders/v2/${id}/net-amount`, "GET");
        }
    };

    const shareholders = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`sas/shareholders?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("sas/shareholders", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`sas/shareholders/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`sas/shareholders/${id}`, "DELETE");
        },
        validatePercentages: async () => {
            return api.authRequest("sas/shareholders/validate-percentages", "GET");
        }
    };

    const exchangeRates = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`sas/exchange-rates?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("sas/exchange-rates", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`sas/exchange-rates/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`sas/exchange-rates/${id}`, "DELETE");
        },
        getLatest: async (currencyPair: string) => {
            return api.authRequest(`sas/exchange-rates/latest/${currencyPair}`, "GET");
        },
        getByDate: async (currencyPair: string, date: string) => {
            return api.authRequest(`sas/exchange-rates/date/${currencyPair}?date=${date}`, "GET");
        },
        fetchToday: async () => {
            return api.authRequest("sas/exchange-rates/fetch-today", "POST");
        },
        fetchLast30Days: async () => {
            return api.authRequest("sas/exchange-rates/fetch-last-30-days", "POST");
        },
        importCSV: async (csvContent: string, currencyPair?: string, fileName?: string) => {
            return api.authRequest("sas/exchange-rates/import-csv", "POST", { csvContent, currencyPair, fileName });
        },
        validateImport: async (csvContent: string, currencyPair: string) => {
            return api.authRequest("sas/exchange-rates/validate-import", "POST", { csvContent, currencyPair });
        }
    };

    const profitSharing = {
        getMonthly: async (year: string, month: string) => {
            return api.authRequest(`sas/profit-sharing/monthly?year=${year}&month=${month}`, "GET");
        }
    };

    const paymentChecklist = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`sas/payment-checklist?${query}`, "GET");
        },
        save: async (data: any) => {
            return api.authRequest("sas/payment-checklist", "POST", data);
        },
        getAvailableOrders: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`sas/payment-checklist/available-orders?${query}`, "GET");
        }
    };

    return {
        costCenters,
        commercialPartners,
        campaigns,
        paymentOrders,
        shareholders,
        exchangeRates,
        profitSharing,
        paymentChecklist
    };
};

