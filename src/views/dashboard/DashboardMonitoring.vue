<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMonitoring } from '@/composables/useMonitoring.js';
import { useWatchlist } from '@/composables/useWatchlist.js';
import { useLeaks } from '@/composables/useLeaks.js';
import AssetAddModal from '@/components/AssetAddModal.vue';
import DomainAddModal from '@/components/DomainAddModal.vue';
import LeakBadge from '@/components/LeakBadge.vue';

const router = useRouter();
const { assets, error: assetError, fetchAssets, addAsset, removeAsset, toggleAsset } = useMonitoring();
const { domains, fetchDomains, addDomain, removeDomain, toggleActive } = useWatchlist();
const { leaks, fetchLeaks } = useLeaks();

const activeTab = ref('domains');
const showDomainModal = ref(false);
const showAssetModal = ref(false);
const assetModalDefaultType = ref('email');
const confirmDeleteId = ref(null);

const tabs = [
  { id: 'domains', label: 'Domains', icon: '◉' },
  { id: 'emails', label: 'Emails', icon: '✉' },
  { id: 'usernames', label: 'Usernames', icon: '@' },
  { id: 'subdomains', label: 'Subdomains', icon: '◈' },
];

const filteredAssets = computed(() => {
  if (activeTab.value === 'emails') return assets.value.filter((a) => a.asset_type === 'email');
  if (activeTab.value === 'usernames') return assets.value.filter((a) => a.asset_type === 'username');
  if (activeTab.value === 'subdomains') return assets.value.filter((a) => a.asset_type === 'subdomain');
  return [];
});

const leaksByAsset = computed(() => {
  const map = {};
  for (const l of leaks.value) {
    if (!map[l.asset_id]) map[l.asset_id] = [];
    map[l.asset_id].push(l);
  }
  return map;
});

onMounted(async () => {
  await Promise.all([fetchDomains(), fetchAssets(), fetchLeaks()]);
});

watch(activeTab, () => {
  confirmDeleteId.value = null;
});

function openAssetModal(type) {
  assetModalDefaultType.value = type;
  showAssetModal.value = true;
}

async function onAddDomain(hostname) {
  const r = await addDomain(hostname);
  if (r) showDomainModal.value = false;
}

async function onAddAsset(payload) {
  const r = await addAsset(payload);
  if (r) showAssetModal.value = false;
}

function onDeleteDomain(id) {
  if (confirmDeleteId.value === id) {
    removeDomain(id);
    confirmDeleteId.value = null;
  } else confirmDeleteId.value = id;
}

function onDeleteAsset(id) {
  if (confirmDeleteId.value === id) {
    removeAsset(id);
    confirmDeleteId.value = null;
  } else confirmDeleteId.value = id;
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

function highestLeakSeverity(assetId) {
  const ls = leaksByAsset.value[assetId];
  if (!ls?.length) return null;
  const order = { critical: 4, high: 3, medium: 2, low: 1 };
  return ls.reduce((max, l) => (order[l.severity] > order[max] ? l.severity : max), 'low');
}
</script>

<template>
  <section class="dashboard-panel">
    <div class="monitoring-header">
      <div>
        <h1 class="dashboard-panel__title">Monitoring</h1>
        <p class="dashboard-panel__lead">
          Track domains, emails, usernames and subdomains. Get alerted on typosquats and leaks.
        </p>
      </div>
    </div>

    <div class="monitoring-tabs" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="monitoring-tab"
        :class="{ 'is-active': activeTab === t.id }"
        :aria-selected="activeTab === t.id"
        role="tab"
        @click="activeTab = t.id"
      >
        <span class="monitoring-tab__icon">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span class="monitoring-tab__count">
          {{ t.id === 'domains' ? domains.length : assets.filter((a) => a.asset_type === t.id.slice(0, -1)).length }}
        </span>
      </button>
    </div>

    <p v-if="assetError" class="watchlist-error">{{ assetError }}</p>

    <!-- DOMAINS TAB -->
    <div v-if="activeTab === 'domains'" class="monitoring-section">
      <div class="monitoring-section__header">
        <h2 class="monitoring-section__title">Monitored domains</h2>
        <button type="button" class="btn btn--primary btn--small" @click="showDomainModal = true">
          + Add domain
        </button>
      </div>

      <div v-if="!domains.length" class="watchlist-empty">
        <p>No domains monitored yet.</p>
        <button type="button" class="btn btn--primary" @click="showDomainModal = true">
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
                @click="toggleActive(d.id, !d.is_active)"
              >
                {{ d.is_active ? '⏸' : '▶' }}
              </button>
              <button
                type="button"
                class="watchlist-card__action watchlist-card__action--danger"
                @click="onDeleteDomain(d.id)"
              >
                {{ confirmDeleteId === d.id ? '✓' : '✗' }}
              </button>
            </div>
          </div>
          <div class="watchlist-card__meta">Added {{ timeAgo(d.created_at) }}</div>
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
              Findings
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EMAIL / USERNAME / SUBDOMAIN TAB -->
    <div v-else class="monitoring-section">
      <div class="monitoring-section__header">
        <h2 class="monitoring-section__title">
          {{ activeTab === 'emails' ? 'Monitored emails' : activeTab === 'usernames' ? 'Monitored usernames' : 'Monitored subdomains' }}
        </h2>
        <button
          type="button"
          class="btn btn--primary btn--small"
          @click="openAssetModal(activeTab.slice(0, -1))"
        >
          + Add {{ activeTab.slice(0, -1) }}
        </button>
      </div>

      <div v-if="!filteredAssets.length" class="watchlist-empty">
        <p>No {{ activeTab }} monitored yet.</p>
        <button
          type="button"
          class="btn btn--primary"
          @click="openAssetModal(activeTab.slice(0, -1))"
        >
          + Add your first {{ activeTab.slice(0, -1) }}
        </button>
      </div>

      <div v-else class="asset-list">
        <div
          v-for="a in filteredAssets"
          :key="a.id"
          class="asset-row"
          :class="{ 'asset-row--inactive': !a.is_active, 'asset-row--compromised': leaksByAsset[a.id]?.length }"
        >
          <div class="asset-row__main">
            <span class="asset-row__dot" :class="{ 'asset-row__dot--active': a.is_active }" />
            <div class="asset-row__info">
              <code class="asset-row__value">{{ a.asset_value }}</code>
              <div class="asset-row__meta">
                <span v-if="a.label" class="asset-row__label">{{ a.label }}</span>
                <span v-if="a.monitored_domains" class="asset-row__domain">
                  ↳ {{ a.monitored_domains.canonical_hostname }}
                </span>
                <span class="asset-row__time">Added {{ timeAgo(a.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="asset-row__status">
            <LeakBadge
              v-if="leaksByAsset[a.id]?.length"
              :severity="highestLeakSeverity(a.id)"
              :password-exposed="leaksByAsset[a.id].some((l) => l.password_exposed)"
            />
            <span v-else class="asset-row__safe">✓ Safe</span>
            <span v-if="leaksByAsset[a.id]?.length" class="asset-row__leak-count">
              {{ leaksByAsset[a.id].length }} leak{{ leaksByAsset[a.id].length > 1 ? 's' : '' }}
            </span>
          </div>

          <div class="asset-row__actions">
            <button
              v-if="leaksByAsset[a.id]?.length"
              type="button"
              class="btn btn--small btn--ghost"
              @click="router.push({ name: 'dashboard-leaks', query: { asset: a.id } })"
            >
              View
            </button>
            <button
              type="button"
              class="watchlist-card__action"
              @click="toggleAsset(a.id, !a.is_active)"
            >
              {{ a.is_active ? '⏸' : '▶' }}
            </button>
            <button
              type="button"
              class="watchlist-card__action watchlist-card__action--danger"
              @click="onDeleteAsset(a.id)"
            >
              {{ confirmDeleteId === a.id ? '✓' : '✗' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <DomainAddModal
      v-if="showDomainModal"
      @add="onAddDomain"
      @close="showDomainModal = false"
    />
    <AssetAddModal
      v-if="showAssetModal"
      :default-type="assetModalDefaultType"
      @add="onAddAsset"
      @close="showAssetModal = false"
    />
  </section>
</template>
