//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';

import { useNavbar } from '@cmmv/blog/admin/composable/useNavbar';
import AdminLayout from '@cmmv/blog/admin/layouts/AdminLayout.vue';
import CostCentersView from './views/CostCentersView.vue';
import CommercialPartnersView from './views/CommercialPartnersView.vue';
import CampaignsView from './views/CampaignsView.vue';
import PaymentOrdersView from './views/PaymentOrdersView.vue';
import ShareholdersView from './views/ShareholdersView.vue';
import ExchangeRatesView from './views/ExchangeRatesView.vue';
import ProfitSharingView from './views/ProfitSharingView.vue';
import PaymentChecklistView from './views/PaymentChecklistView.vue';
import TagsView from './views/TagsView.vue';
import ScriptSettingsView from './views/ScriptSettingsView.vue';
import TicketsView from './views/TicketsView.vue';
import ActivationTicketsView from './views/ActivationTicketsView.vue';
import ScriptCreationTicketsView from './views/ScriptCreationTicketsView.vue';
import TicketSettingsView from './views/TicketSettingsView.vue';

export const sasRoutes: RouteRecordRaw[] = [
    {
        path: '/affiliation-manager',
        component: AdminLayout,
        children: [
            {
                path: 'cost-centers',
                component: CostCentersView,
                name: 'affiliation-manager.cost-centers'
            },
            {
                path: 'commercial-partners',
                component: CommercialPartnersView,
                name: 'affiliation-manager.commercial-partners'
            },
            {
                path: 'campaigns',
                component: CampaignsView,
                name: 'affiliation-manager.campaigns'
            },
            {
                path: 'payment-orders',
                component: PaymentOrdersView,
                name: 'affiliation-manager.payment-orders'
            },
            {
                path: 'shareholders',
                component: ShareholdersView,
                name: 'affiliation-manager.shareholders'
            },
            {
                path: 'exchange-rates',
                component: ExchangeRatesView,
                name: 'affiliation-manager.exchange-rates'
            },
            {
                path: 'profit-sharing',
                component: ProfitSharingView,
                name: 'affiliation-manager.profit-sharing'
            },
            {
                path: 'payment-checklist',
                component: PaymentChecklistView,
                name: 'affiliation-manager.payment-checklist'
            },
            {
                path: 'tags',
                component: TagsView,
                name: 'affiliation-manager.tags'
            },
            {
                path: 'script-settings',
                component: ScriptSettingsView,
                name: 'affiliation-manager.script-settings'
            },
            {
                path: 'tickets',
                component: TicketsView,
                name: 'affiliation-manager.tickets'
            },
            {
                path: 'tickets/activation',
                component: ActivationTicketsView,
                name: 'affiliation-manager.tickets.activation'
            },
            {
                path: 'tickets/script-creation',
                component: ScriptCreationTicketsView,
                name: 'affiliation-manager.tickets.script-creation'
            },
            {
                path: 'tickets/settings',
                component: TicketSettingsView,
                name: 'affiliation-manager.tickets.settings'
            }
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    // Grupo CAMPANHAS
    {
        label: 'Parceiros Comerciais',
        icon: 'fas fa-handshake',
        to: '/affiliation-manager/commercial-partners',
        group: 'CAMPANHAS'
    },
    {
        label: 'Campanhas',
        icon: 'fas fa-bullhorn',
        to: '/affiliation-manager/campaigns',
        group: 'CAMPANHAS'
    },
    // Grupo FINANCEIRO
    {
        label: 'Centros de Custos',
        icon: 'fas fa-building',
        to: '/affiliation-manager/cost-centers',
        group: 'FINANCEIRO'
    },
    {
        label: 'Ordens de Pagamento',
        icon: 'fas fa-file-invoice-dollar',
        to: '/affiliation-manager/payment-orders',
        group: 'FINANCEIRO'
    },
    {
        label: 'Sócios',
        icon: 'fas fa-users',
        to: '/affiliation-manager/shareholders',
        group: 'FINANCEIRO'
    },
    {
        label: 'Cotações de Moedas',
        icon: 'fas fa-exchange-alt',
        to: '/affiliation-manager/exchange-rates',
        group: 'FINANCEIRO'
    },
    {
        label: 'Divisão de Lucros',
        icon: 'fas fa-chart-pie',
        to: '/affiliation-manager/profit-sharing',
        group: 'FINANCEIRO'
    },
    {
        label: 'Checklist de Pagamentos',
        icon: 'fas fa-clipboard-check',
        to: '/affiliation-manager/payment-checklist',
        group: 'FINANCEIRO'
    },
    // Grupo TAGS
    {
        label: 'Tags',
        icon: 'fas fa-tags',
        to: '/affiliation-manager/tags',
        group: 'TAGS'
    },
    {
        label: 'Configurações de Scripts',
        icon: 'fas fa-code',
        to: '/affiliation-manager/script-settings',
        group: 'TAGS'
    },
    // Grupo Chamados
    {
        label: 'Tickets',
        icon: 'fas fa-ticket-alt',
        to: '/affiliation-manager/tickets',
        group: 'Chamados'
    },
    {
        label: 'Ativação/Desativação',
        icon: 'fas fa-power-off',
        to: '/affiliation-manager/tickets/activation',
        group: 'Chamados'
    },
    {
        label: 'Criação de Scripts',
        icon: 'fas fa-code',
        to: '/affiliation-manager/tickets/script-creation',
        group: 'Chamados'
    },
    {
        label: 'Configurações de Tickets',
        icon: 'fas fa-cog',
        to: '/affiliation-manager/tickets/settings',
        group: 'Chamados'
    }
])




