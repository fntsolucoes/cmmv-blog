//@ts-ignore
import { useApi } from '@cmmv/blog/admin/api';

export const useSasClient = () => {
    const api = useApi();

    const costCenters = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliation-manager/cost-centers?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliation-manager/cost-centers", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliation-manager/cost-centers/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliation-manager/cost-centers/${id}`, "DELETE");
        }
    };

    const commercialPartners = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliation-manager/commercial-partners?${query}`, "GET");
        },
        getAll: async () => {
            return api.authRequest(`affiliation-manager/commercial-partners/all`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliation-manager/commercial-partners", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliation-manager/commercial-partners/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliation-manager/commercial-partners/${id}`, "DELETE");
        },
        getById: async (id: string) => {
            return api.authRequest(`affiliation-manager/commercial-partners/${id}`, "GET");
        },
        getPaymentOrdersHistory: async (id: string) => {
            return api.authRequest(`affiliation-manager/commercial-partners/${id}/payment-orders`, "GET");
        },
        validateLinks: async () => {
            return api.authRequest("affiliation-manager/commercial-partners/validate-links", "POST");
        },
        validateLink: async (id: string) => {
            return api.authRequest(`affiliation-manager/commercial-partners/${id}/validate-link`, "POST");
        }
    };

    const campaigns = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliation-manager/campaigns?${query}`, "GET");
        },
        getAll: async () => {
            return api.authRequest(`affiliation-manager/campaigns/all`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliation-manager/campaigns", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliation-manager/campaigns/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliation-manager/campaigns/${id}`, "DELETE");
        },
        getActiveByPartner: async (partnerId: string) => {
            return api.authRequest(`affiliation-manager/campaigns/partner/${partnerId}/active`, "GET");
        },
        getAllByPartner: async (partnerId: string) => {
            return api.authRequest(`affiliation-manager/campaigns/partner/${partnerId}/all`, "GET");
        },
        validateLinks: async () => {
            return api.authRequest("affiliation-manager/campaigns/validate-links", "POST");
        },
        validateLink: async (campaignId: string) => {
            return api.authRequest(`affiliation-manager/campaigns/${campaignId}/validate-link`, "POST");
        }
    };

    const tags = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliation-manager/tags?${query}`, "GET");
        },
        getAll: async () => {
            return api.authRequest(`affiliation-manager/tags/all`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliation-manager/tags", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliation-manager/tags/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliation-manager/tags/${id}`, "DELETE");
        }
    };

    const paymentOrders = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliation-manager/payment-orders/v2?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliation-manager/payment-orders/v2", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliation-manager/payment-orders/v2/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliation-manager/payment-orders/v2/${id}`, "DELETE");
        },
        updateStatus: async (id: string, data: { status: string; effectivePaymentDate?: string | Date | null; paidValue?: number | null }) => {
            return api.authRequest(`affiliation-manager/payment-orders/v2/${id}/status`, "PATCH", data);
        },
        getNetAmount: async (id: string) => {
            return api.authRequest(`affiliation-manager/payment-orders/v2/${id}/net-amount`, "GET");
        }
    };

    const shareholders = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliation-manager/shareholders?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliation-manager/shareholders", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliation-manager/shareholders/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliation-manager/shareholders/${id}`, "DELETE");
        },
        validatePercentages: async () => {
            return api.authRequest("affiliation-manager/shareholders/validate-percentages", "GET");
        }
    };

    const exchangeRates = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliation-manager/exchange-rates?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliation-manager/exchange-rates", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliation-manager/exchange-rates/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliation-manager/exchange-rates/${id}`, "DELETE");
        },
        getLatest: async (currencyPair: string) => {
            return api.authRequest(`affiliation-manager/exchange-rates/latest/${currencyPair}`, "GET");
        },
        getByDate: async (currencyPair: string, date: string) => {
            return api.authRequest(`affiliation-manager/exchange-rates/date/${currencyPair}?date=${date}`, "GET");
        },
        fetchToday: async () => {
            return api.authRequest("affiliation-manager/exchange-rates/fetch-today", "POST");
        },
        fetchLast30Days: async () => {
            return api.authRequest("affiliation-manager/exchange-rates/fetch-last-30-days", "POST");
        },
        importCSV: async (csvContent: string, currencyPair?: string, fileName?: string) => {
            return api.authRequest("affiliation-manager/exchange-rates/import-csv", "POST", { csvContent, currencyPair, fileName });
        },
        validateImport: async (csvContent: string, currencyPair: string) => {
            return api.authRequest("affiliation-manager/exchange-rates/validate-import", "POST", { csvContent, currencyPair });
        }
    };

    const profitSharing = {
        getMonthly: async (year: string, month: string) => {
            return api.authRequest(`affiliation-manager/profit-sharing/monthly?year=${year}&month=${month}`, "GET");
        }
    };

    const paymentChecklist = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliation-manager/payment-checklist?${query}`, "GET");
        },
        save: async (data: any) => {
            return api.authRequest("affiliation-manager/payment-checklist", "POST", data);
        },
        getAvailableOrders: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliation-manager/payment-checklist/available-orders?${query}`, "GET");
        }
    };

    const tickets = {
        get: async (filters: Record<string, any>) => {
            // Filtrar valores null, undefined e strings vazias
            const cleanFilters: Record<string, string> = {};
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined && value !== '') {
                    // Converter null explícito para string 'null' se necessário
                    // Mas normalmente não incluímos null na query
                    if (value === null) {
                        cleanFilters[key] = 'null';
                    } else {
                        cleanFilters[key] = String(value);
                    }
                }
            }
            const query = new URLSearchParams(cleanFilters).toString();
            return api.authRequest(`affiliation-manager/tickets${query ? `?${query}` : ''}`, "GET");
        },
        getById: async (id: string) => {
            return api.authRequest(`affiliation-manager/tickets/${id}`, "GET");
        },
        create: async (data: any) => {
            return api.authRequest("affiliation-manager/tickets", "POST", data);
        },
        updateStatus: async (id: string, data: { status: string; resolutionNote?: string; userId: string }) => {
            return api.authRequest(`affiliation-manager/tickets/${id}/status`, "PATCH", data);
        },
        reopen: async (id: string, data: { userId: string; maxDaysToReopen?: number }) => {
            return api.authRequest(`affiliation-manager/tickets/${id}/reopen`, "PATCH", data);
        },
        assign: async (id: string, data: { assignedTo: string; userId: string; assignmentType?: 'manual' | 'automatic' | 'random' }) => {
            return api.authRequest(`affiliation-manager/tickets/${id}/assign`, "PATCH", data);
        },
        updatePriority: async (id: string, data: { priority: string; userId: string }) => {
            return api.authRequest(`affiliation-manager/tickets/${id}/priority`, "PATCH", data);
        },
        getHistory: async (id: string) => {
            return api.authRequest(`affiliation-manager/tickets/${id}/history`, "GET");
        },
        checkSLAs: async () => {
            return api.authRequest("affiliation-manager/tickets/check-slas", "POST");
        },
        open: async (id: string, data: { userId: string }) => {
            return api.authRequest(`affiliation-manager/tickets/${id}/open`, "POST", data);
        }
    };

    const ticketComments = {
        get: async (ticketId: string) => {
            const query = new URLSearchParams({ ticketId }).toString();
            return api.authRequest(`affiliation-manager/ticket-comments?${query}`, "GET");
        },
        create: async (data: { ticketId: string; userId: string; content: string; isInternal?: boolean }) => {
            return api.authRequest("affiliation-manager/ticket-comments", "POST", data);
        },
        update: async (id: string, data: { content: string; isInternal?: boolean }) => {
            return api.authRequest(`affiliation-manager/ticket-comments/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliation-manager/ticket-comments/${id}`, "DELETE");
        }
    };

    const ticketPartners = {
        getAll: async () => {
            return api.authRequest(`affiliation-manager/ticket-partners/all`, "GET");
        },
        getAllIncludingInactive: async () => {
            return api.authRequest(`affiliation-manager/ticket-partners/all-including-inactive`, "GET");
        },
        getDefault: async () => {
            return api.authRequest(`affiliation-manager/ticket-partners/default`, "GET");
        },
        getById: async (id: string) => {
            return api.authRequest(`affiliation-manager/ticket-partners/${id}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliation-manager/ticket-partners", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliation-manager/ticket-partners/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliation-manager/ticket-partners/${id}`, "DELETE");
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
        paymentChecklist,
        tags,
        tickets,
        ticketComments,
        ticketPartners
    };
};

