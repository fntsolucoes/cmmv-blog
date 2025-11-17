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

export const sasRoutes: RouteRecordRaw[] = [
    {
        path: '/sas',
        component: AdminLayout,
        children: [
            {
                path: 'cost-centers',
                component: CostCentersView,
                name: 'sas.cost-centers'
            },
            {
                path: 'commercial-partners',
                component: CommercialPartnersView,
                name: 'sas.commercial-partners'
            },
            {
                path: 'campaigns',
                component: CampaignsView,
                name: 'sas.campaigns'
            },
            {
                path: 'payment-orders',
                component: PaymentOrdersView,
                name: 'sas.payment-orders'
            },
            {
                path: 'shareholders',
                component: ShareholdersView,
                name: 'sas.shareholders'
            },
            {
                path: 'exchange-rates',
                component: ExchangeRatesView,
                name: 'sas.exchange-rates'
            },
            {
                path: 'profit-sharing',
                component: ProfitSharingView,
                name: 'sas.profit-sharing'
            }
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    {
        label: 'Centros de Custos',
        icon: 'fas fa-building',
        to: '/sas/cost-centers',
        group: 'SaS'
    },
    {
        label: 'Parceiros Comerciais',
        icon: 'fas fa-handshake',
        to: '/sas/commercial-partners',
        group: 'SaS'
    },
    {
        label: 'Campanhas',
        icon: 'fas fa-bullhorn',
        to: '/sas/campaigns',
        group: 'SaS'
    },
    {
        label: 'Ordens de Pagamento',
        icon: 'fas fa-file-invoice-dollar',
        to: '/sas/payment-orders',
        group: 'SaS'
    },
    {
        label: 'Sócios',
        icon: 'fas fa-users',
        to: '/sas/shareholders',
        group: 'SaS'
    },
    {
        label: 'Taxas de Câmbio',
        icon: 'fas fa-exchange-alt',
        to: '/sas/exchange-rates',
        group: 'SaS'
    },
    {
        label: 'Divisão de Lucros',
        icon: 'fas fa-chart-pie',
        to: '/sas/profit-sharing',
        group: 'SaS'
    }
])



