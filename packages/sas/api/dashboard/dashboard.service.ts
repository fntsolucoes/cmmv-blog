import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class DashboardService {
    /**
     * Buscar dados do dashboard SAS
     */
    async getDashboardData() {
        console.log('[DashboardService] Iniciando busca de dados do dashboard...');
        
        const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
        const CommercialPartnersEntity = Repository.getEntity("SasCommercialPartnersEntity");
        const PaymentOrdersEntity = Repository.getEntity("SasPaymentOrdersEntity");

        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        console.log(`[DashboardService] Mês/Ano atual: ${currentMonth}/${currentYear}`);

        // Buscar todas as campanhas
        console.log('[DashboardService] Buscando campanhas...');
        const allCampaigns = await Repository.findAll(CampaignsEntity, {
            limit: 10000
        }, []);
        console.log(`[DashboardService] Total de campanhas encontradas: ${allCampaigns?.data?.length || 0}`);

        // Buscar todos os parceiros diretos
        console.log('[DashboardService] Buscando parceiros diretos...');
        const directPartners = await Repository.findAll(CommercialPartnersEntity, {
            partnerType: 'Direto',
            limit: 10000
        }, []);
        console.log(`[DashboardService] Total de parceiros diretos encontrados: ${directPartners?.data?.length || 0}`);

        // Contar campanhas ativas (de rede de afiliação)
        const activeCampaigns = (allCampaigns?.data || []).filter((c: any) => {
            if (!c.active) return false;
            const startDate = new Date(c.startDate);
            startDate.setHours(0, 0, 0, 0);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            
            // Se ainda não começou, não é ativa
            if (todayDate < startDate) return false;
            
            // Se tem data de fim, verificar se já passou
            if (c.endDate) {
                const endDate = new Date(c.endDate);
                endDate.setHours(0, 0, 0, 0);
                return todayDate <= endDate;
            }
            // Se não tem data de fim e já começou, é ativa
            return true;
        });

        // Contar parceiros diretos ativos
        const activeDirectPartners = (directPartners?.data || []).filter((p: any) => {
            if (!p.active) return false;
            
            // Se tem data de início, verificar se já começou
            if (p.startDate) {
                const startDate = new Date(p.startDate);
                startDate.setHours(0, 0, 0, 0);
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                if (todayDate < startDate) return false;
            }
            
            // Se tem data de fim, verificar se já passou
            if (p.endDate) {
                const endDate = new Date(p.endDate);
                endDate.setHours(0, 0, 0, 0);
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                return todayDate <= endDate;
            }
            
            // Se está ativo e não tem restrições de data, é ativo
            return true;
        });

        const totalActiveCampaigns = activeCampaigns.length + activeDirectPartners.length;
        console.log(`[DashboardService] Campanhas ativas: ${activeCampaigns.length} (rede) + ${activeDirectPartners.length} (diretas) = ${totalActiveCampaigns}`);

        // Contar tags ativas (scriptStatus = "Implementado")
        // Incluir campanhas de rede e parceiros diretos
        const activeTagsFromCampaigns = (allCampaigns?.data || []).filter((c: any) => 
            c.scriptStatus === 'Implementado'
        ).length;
        const activeTagsFromPartners = (directPartners?.data || []).filter((p: any) => 
            p.scriptStatus === 'Implementado'
        ).length;
        const activeTags = activeTagsFromCampaigns + activeTagsFromPartners;

        // Contar tags que cairam (scriptStatus = "Caiu")
        const fallenTagsFromCampaigns = (allCampaigns?.data || []).filter((c: any) => 
            c.scriptStatus === 'Caiu'
        ).length;
        const fallenTagsFromPartners = (directPartners?.data || []).filter((p: any) => 
            p.scriptStatus === 'Caiu'
        ).length;
        const fallenTags = fallenTagsFromCampaigns + fallenTagsFromPartners;

        // Contar tags pendentes (scriptStatus = "Pendente de instalar")
        const pendingTagsFromCampaigns = (allCampaigns?.data || []).filter((c: any) => 
            c.scriptStatus === 'Pendente de instalar'
        ).length;
        const pendingTagsFromPartners = (directPartners?.data || []).filter((p: any) => 
            p.scriptStatus === 'Pendente de instalar'
        ).length;
        const pendingTags = pendingTagsFromCampaigns + pendingTagsFromPartners;
        
        console.log(`[DashboardService] Tags ativas: ${activeTags} (${activeTagsFromCampaigns} campanhas + ${activeTagsFromPartners} parceiros)`);
        console.log(`[DashboardService] Tags que cairam: ${fallenTags} (${fallenTagsFromCampaigns} campanhas + ${fallenTagsFromPartners} parceiros)`);
        console.log(`[DashboardService] Tags pendentes: ${pendingTags} (${pendingTagsFromCampaigns} campanhas + ${pendingTagsFromPartners} parceiros)`);

        // Buscar todas as notas de pagamento
        console.log('[DashboardService] Buscando notas de pagamento...');
        const allPaymentOrders = await Repository.findAll(PaymentOrdersEntity, {
            limit: 10000
        }, []);
        console.log(`[DashboardService] Total de notas encontradas: ${allPaymentOrders?.data?.length || 0}`);

        // Contar e somar valores de notas pagas no mês vigente
        const paidOrdersThisMonth = (allPaymentOrders?.data || []).filter((order: any) => {
            if (order.status !== 'Pago' || !order.effectivePaymentDate) return false;
            const paymentDate = new Date(order.effectivePaymentDate);
            return paymentDate.getMonth() + 1 === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
        });
        
        const paidThisMonth = paidOrdersThisMonth.length;
        const totalReceivedThisMonth = paidOrdersThisMonth.reduce((sum: number, order: any) => {
            // Usar paidValue se disponível, senão calcular invoiceAmount - taxAmount
            const value = order.paidValue || (order.invoiceAmount - (order.taxAmount || 0));
            return sum + (value || 0);
        }, 0);

        // Contar e somar valores de notas pendentes (todos os meses)
        const pendingOrdersList = (allPaymentOrders?.data || []).filter((order: any) => 
            order.status === 'Pendente'
        );
        
        const pendingOrders = pendingOrdersList.length;
        const totalPendingValue = pendingOrdersList.reduce((sum: number, order: any) => {
            // Calcular valor líquido: invoiceAmount - taxAmount
            const netValue = (order.invoiceAmount || 0) - (order.taxAmount || 0);
            return sum + netValue;
        }, 0);
        
        console.log(`[DashboardService] Notas pagas no mês vigente: ${paidThisMonth}`);
        console.log(`[DashboardService] Valor total recebido no mês: ${totalReceivedThisMonth}`);
        console.log(`[DashboardService] Notas pendentes: ${pendingOrders}`);
        console.log(`[DashboardService] Valor total pendente: ${totalPendingValue}`);

        // Agregar notas por mês (últimos 12 meses)
        const notesByMonth: Record<string, { paid: number; pending: number }> = {};
        const last12Months: string[] = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            last12Months.push(monthKey);
            notesByMonth[monthKey] = { paid: 0, pending: 0 };
        }
        
        (allPaymentOrders?.data || []).forEach((order: any) => {
            if (order.status === 'Pago' && order.effectivePaymentDate) {
                const paymentDate = new Date(order.effectivePaymentDate);
                const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
                if (notesByMonth[monthKey]) {
                    notesByMonth[monthKey].paid++;
                }
            } else if (order.status === 'Pendente') {
                // Para pendentes, usar o mês esperado de pagamento (expectedPaymentMonth)
                if (order.expectedPaymentMonth) {
                    const monthKey = order.expectedPaymentMonth; // Formato: YYYY-MM
                    if (notesByMonth[monthKey]) {
                        notesByMonth[monthKey].pending++;
                    }
                }
            }
        });

        // Agregar tags por mês (últimos 12 meses)
        const tagsByMonth: Record<string, { implemented: number; pending: number; fallen: number }> = {};
        
        last12Months.forEach(monthKey => {
            tagsByMonth[monthKey] = { implemented: 0, pending: 0, fallen: 0 };
        });
        
        // Processar campanhas - usar createdAt se disponível, senão usar startDate
        (allCampaigns?.data || []).forEach((campaign: any) => {
            const dateToUse = campaign.createdAt || campaign.startDate;
            if (dateToUse) {
                const date = new Date(dateToUse);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (tagsByMonth[monthKey]) {
                    if (campaign.scriptStatus === 'Implementado') {
                        tagsByMonth[monthKey].implemented++;
                    } else if (campaign.scriptStatus === 'Pendente de instalar') {
                        tagsByMonth[monthKey].pending++;
                    } else if (campaign.scriptStatus === 'Caiu') {
                        tagsByMonth[monthKey].fallen++;
                    }
                }
            }
        });
        
        // Processar parceiros diretos - usar createdAt se disponível, senão usar startDate
        (directPartners?.data || []).forEach((partner: any) => {
            const dateToUse = partner.createdAt || partner.startDate;
            if (dateToUse) {
                const date = new Date(dateToUse);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (tagsByMonth[monthKey]) {
                    if (partner.scriptStatus === 'Implementado') {
                        tagsByMonth[monthKey].implemented++;
                    } else if (partner.scriptStatus === 'Pendente de instalar') {
                        tagsByMonth[monthKey].pending++;
                    } else if (partner.scriptStatus === 'Caiu') {
                        tagsByMonth[monthKey].fallen++;
                    }
                }
            }
        });

        const result = {
            totalActiveCampaigns,
            activeTags,
            fallenTags,
            pendingTags,
            paidThisMonth,
            pendingOrders,
            totalReceivedThisMonth,
            totalPendingValue,
            notesByMonth: last12Months.map(month => ({
                month,
                paid: notesByMonth[month].paid,
                pending: notesByMonth[month].pending
            })),
            tagsByMonth: last12Months.map(month => ({
                month,
                implemented: tagsByMonth[month].implemented,
                pending: tagsByMonth[month].pending,
                fallen: tagsByMonth[month].fallen
            }))
        };
        
        console.log('[DashboardService] ✅ Dados do dashboard calculados:', result);
        return result;
    }
}

