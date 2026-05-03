<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthModal } from '@/composables/useAuthModal.js';
import { useAuthSession } from '@/composables/useAuthSession.js';

const route = useRoute();
const { open } = useAuthModal();

/** Scan = home (top of page), not the #scan anchor */
function onScanNavClick() {
  if (route.path === '/') {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}
const { session, loading } = useAuthSession();

const logoTo = computed(() =>
  session.value ? { name: 'dashboard-overview' } : '/'
);

const dashboardOverview = { name: 'dashboard-overview' };
</script>

<template>
  <header class="site-header">
    <div class="wrap">
      <RouterLink class="logo" :to="logoTo">oriradar</RouterLink>
      <nav class="nav" aria-label="Main navigation">
        <RouterLink to="/" @click="onScanNavClick">Scan</RouterLink>
        <RouterLink :to="{ path: '/', hash: '#features' }">Features</RouterLink>
        <RouterLink :to="{ path: '/', hash: '#pricing' }">Price</RouterLink>
        <template v-if="!loading">
          <RouterLink
            v-if="session"
            class="nav-signin"
            :to="dashboardOverview"
          >
            Dashboard
          </RouterLink>
          <button
            v-else
            type="button"
            class="nav-signin"
            @click="open('default')"
          >
            Sign in
          </button>
        </template>
      </nav>
    </div>
  </header>
</template>
