<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWatchlist } from '@/composables/useWatchlist.js';
import DomainAddModal from '@/components/DomainAddModal.vue';

const router = useRouter();
const { domains, loading, error, fetchDomains, addDomain, removeDomain, toggleActive } = useWatchlist();

const showAddModal = ref(false);
const confirmDeleteId = ref(null);

onMounted(() => fetchDomains());

async function onAdd(hostname) {
  const result = await addDomain(hostname);
  if (result) showAddModal.value = false;
}

function onDelete(id) {
  if (confirmDeleteId.value === id) {
    removeDomain(id);
    confirmDeleteId.value = null;
  } else {
    confirmDeleteId.value = id;
  }
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
</script>

<template>
  <section class="dashboard-panel">
    <div class="watchlist-header">
      <div>
        <h1 class="dashboard-panel__title">Watchlist</h1>
        <p class="dashboard-panel__lead">
          Domains you monitor for typosquatting and brand abuse.
        </p>
      </div>
      <button type="button" class="btn btn--primary" @click="showAddModal = true">
        + Add domain
      </button>
    </div>

    <p v-if="error" class="watchlist-error">{{ error }}</p>

    <div v-if="loading" class="watchlist-loading">Loading watchlist...</div>

    <div v-else-if="!domains.length" class="watchlist-empty">
      <p>No domains monitored yet.</p>
      <button type="button" class="btn btn--primary" @click="showAddModal = true">
        + Add your first domain
      </button>
    </div>

    <div v-else class="watchlist-grid">
      <div
        v-for="d in domains"
        :key="d.id"
        class="watchlist-card"
        :class="{ 'watchlist-card--inactive': !d.is_active }"
      >
        <div class="watchlist-card__header">
          <div class="watchlist-card__status">
            <span class="watchlist-card__dot" :class="{ 'watchlist-card__dot--active': d.is_active }" />
            <code class="watchlist-card__hostname">{{ d.canonical_hostname }}</code>
          </div>
          <div class="watchlist-card__actions">
            <button
              type="button"
              class="watchlist-card__action"
              :title="d.is_active ? 'Pause monitoring' : 'Resume monitoring'"
              @click="toggleActive(d.id, !d.is_active)"
            >
              {{ d.is_active ? '⏸' : '▶' }}
            </button>
            <button
              type="button"
              class="watchlist-card__action watchlist-card__action--danger"
              :title="confirmDeleteId === d.id ? 'Click again to confirm' : 'Remove'"
              @click="onDelete(d.id)"
            >
              {{ confirmDeleteId === d.id ? '✓ Confirm' : '✗' }}
            </button>
          </div>
        </div>
        <div class="watchlist-card__meta">
          <span>Added {{ timeAgo(d.created_at) }}</span>
        </div>
        <div class="watchlist-card__footer">
          <button
            type="button"
            class="btn btn--small"
            @click="router.push({ name: 'dashboard-scan', query: { domain: d.display_url || `https://${d.canonical_hostname}` } })"
          >
            Run scan
          </button>
          <button
            type="button"
            class="btn btn--small btn--ghost"
            @click="router.push({ name: 'dashboard-findings', query: { domain: d.canonical_hostname } })"
          >
            View findings
          </button>
        </div>
      </div>
    </div>

    <DomainAddModal
      v-if="showAddModal"
      @add="onAdd"
      @close="showAddModal = false"
    />
  </section>
</template>
