import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import LoginView from './views/LoginView.vue';

const adminRoutes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: LoginView
    }
]

import { mergePluginRoutes } from '@cmmv/blog/admin/composable/useRouter'
import { blogAdminRoutes } from '@cmmv/blog/admin/router'
import { accessControlRoutes } from '@cmmv/access-control/admin/router';
// Módulo FEEDS removido
// import { rssFeedRoutes } from '@cmmv/rss-aggregation/admin/router';
// import { ytFeedRoutes } from '@cmmv/yt-aggregation/admin/router';
// Módulo AFFILIATE removido
// import { affiliateRoutes } from '@cmmv/affiliate/admin/router';
// Módulo ODDS removido
// import { oddsRoutes } from '@cmmv/odds/admin/router';
import { newsletterRoutes } from '@cmmv/newsletter/admin/router';
import { sasRoutes } from '@cmmv/sas/admin/router';

const mergedRoutes = mergePluginRoutes(
    adminRoutes,
    [
        blogAdminRoutes,
        accessControlRoutes,
        // Módulo FEEDS removido
        // rssFeedRoutes,
        // ytFeedRoutes,
        // Módulo AFFILIATE removido
        // affiliateRoutes,
        // Módulo ODDS removido
        // oddsRoutes,
        newsletterRoutes,
        sasRoutes
    ]
);

const router = createRouter({
    // @ts-ignore
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: mergedRoutes,
})

export default router
