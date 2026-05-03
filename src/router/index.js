import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from '@/lib/supabase.js';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Oriradar - Typosquatting detection' }
  },
  {
    path: '/legal',
    name: 'legal',
    component: () => import('@/views/LegalNoticeView.vue'),
    meta: { title: 'Legal notice - Oriradar' }
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('@/views/PrivacyView.vue'),
    meta: { title: 'Privacy policy - Oriradar' }
  },
  {
    path: '/dashboard',
    component: () => import('@/views/dashboard/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard-overview',
        component: () => import('@/views/dashboard/DashboardOverview.vue'),
        meta: { title: 'Overview - Oriradar' }
      },
      {
        path: 'monitoring',
        name: 'dashboard-monitoring',
        component: () => import('@/views/dashboard/DashboardMonitoring.vue'),
        meta: { title: 'Monitoring - Oriradar' }
      },
      {
        path: 'mapping',
        name: 'dashboard-mapping',
        component: () => import('@/views/dashboard/DashboardMapping.vue'),
        meta: { title: 'Asset map - Oriradar' }
      },
      {
        path: 'leaks',
        name: 'dashboard-leaks',
        component: () => import('@/views/dashboard/DashboardLeaks.vue'),
        meta: { title: 'Leaks - Oriradar' }
      },
      {
        path: 'watchlist',
        name: 'dashboard-watchlist',
        component: () => import('@/views/dashboard/DashboardWatchlist.vue'),
        meta: { title: 'Watchlist - Oriradar' }
      },
      {
        path: 'scan',
        name: 'dashboard-scan',
        component: () => import('@/views/dashboard/DashboardScan.vue'),
        meta: { title: 'Domain scan - Oriradar' }
      },
      {
        path: 'findings',
        name: 'dashboard-findings',
        component: () => import('@/views/dashboard/DashboardFindings.vue'),
        meta: { title: 'Findings - Oriradar' }
      },
      {
        path: 'findings/:id',
        name: 'dashboard-finding-detail',
        component: () => import('@/views/dashboard/DashboardFindingDetail.vue'),
        meta: { title: 'Finding detail - Oriradar' }
      },
      {
        path: 'settings/billing',
        name: 'dashboard-billing',
        component: () => import('@/views/dashboard/DashboardBilling.vue'),
        meta: { title: 'Billing - Oriradar' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, behavior: 'auto' };
    return { top: 0 };
  }
});

router.beforeEach(async (to) => {
  const last = to.matched[to.matched.length - 1];
  if (last?.meta?.title) {
    document.title = last.meta.title;
  }
  const needsAuth = to.matched.some((r) => r.meta.requiresAuth);
  if (!needsAuth) return true;
  if (!supabase) {
    return { path: '/', query: { needAuth: '1' } };
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    return { path: '/', query: { needAuth: '1' } };
  }
  return true;
});

export default router;
