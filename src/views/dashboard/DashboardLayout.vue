<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase.js';
import SiteFooter from '@/components/SiteFooter.vue';

const router = useRouter();
const userEmail = ref('');

onMounted(async () => {
  if (!supabase) {
    router.replace('/');
    return;
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    router.replace('/');
    return;
  }
  userEmail.value = data.session.user.email || '';
});

async function signOut() {
  if (supabase) await supabase.auth.signOut();
  router.push('/');
}
</script>

<template>
  <div class="subpage dashboard-body">
    <header class="site-header">
      <div class="wrap">
        <RouterLink class="logo" :to="{ name: 'dashboard-overview' }">oriradar</RouterLink>
        <nav class="nav" aria-label="Main navigation">
          <span class="dashboard-nav-meta">{{ userEmail }}</span>
          <button type="button" class="nav-signin" @click="signOut">Sign out</button>
        </nav>
      </div>
    </header>

    <main class="subpage-main">
      <div class="dashboard-layout wrap">
        <aside class="dashboard-sidebar" aria-label="Dashboard sections">
          <nav class="dashboard-side-nav">
            <RouterLink
              class="dashboard-side-link"
              active-class=""
              exact-active-class="is-active"
              :to="{ name: 'dashboard-overview' }"
            >
              Overview
            </RouterLink>

            <span class="dashboard-side-group">Surveillance</span>
            <RouterLink
              class="dashboard-side-link dashboard-side-link--sub"
              active-class=""
              exact-active-class="is-active"
              :to="{ name: 'dashboard-monitoring' }"
            >
              Monitoring
            </RouterLink>
            <RouterLink
              class="dashboard-side-link dashboard-side-link--sub"
              active-class=""
              exact-active-class="is-active"
              :to="{ name: 'dashboard-mapping' }"
            >
              Asset map
            </RouterLink>
            <RouterLink
              class="dashboard-side-link dashboard-side-link--sub"
              active-class=""
              exact-active-class="is-active"
              :to="{ name: 'dashboard-leaks' }"
            >
              Leaks
            </RouterLink>

            <span class="dashboard-side-group">Typosquat</span>
            <RouterLink
              class="dashboard-side-link dashboard-side-link--sub"
              active-class=""
              exact-active-class="is-active"
              :to="{ name: 'dashboard-scan' }"
            >
              New scan
            </RouterLink>
            <RouterLink
              class="dashboard-side-link dashboard-side-link--sub"
              active-class=""
              exact-active-class="is-active"
              :to="{ name: 'dashboard-findings' }"
            >
              Findings
            </RouterLink>
            <RouterLink
              class="dashboard-side-link dashboard-side-link--sub"
              active-class=""
              exact-active-class="is-active"
              :to="{ name: 'dashboard-watchlist' }"
            >
              Watchlist
            </RouterLink>

            <span class="dashboard-side-group">Settings</span>
            <RouterLink
              class="dashboard-side-link dashboard-side-link--sub"
              active-class=""
              exact-active-class="is-active"
              :to="{ name: 'dashboard-billing' }"
            >
              Billing
            </RouterLink>
          </nav>
        </aside>

        <div class="dashboard-main">
          <RouterView />
        </div>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>
