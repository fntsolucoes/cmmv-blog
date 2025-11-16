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
        }
    };

    const paymentOrders = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`sas/payment-orders?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("sas/payment-orders", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`sas/payment-orders/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`sas/payment-orders/${id}`, "DELETE");
        },
        getNetAmount: async (id: string) => {
            return api.authRequest(`sas/payment-orders/${id}/net-amount`, "GET");
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
        }
    };

    const profitSharing = {
        getMonthly: async (year: string, month: string) => {
            return api.authRequest(`sas/profit-sharing/monthly?year=${year}&month=${month}`, "GET");
        }
    };

    return {
        costCenters,
        commercialPartners,
        campaigns,
        paymentOrders,
        shareholders,
        exchangeRates,
        profitSharing
    };
};

