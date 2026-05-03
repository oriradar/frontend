<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLeaks } from '@/composables/useLeaks.js';
import { useMonitoring } from '@/composables/useMonitoring.js';
import KpiCard from '@/components/KpiCard.vue';
import LeakBadge from '@/components/LeakBadge.vue';
import AssetAddModal from '@/components/AssetAddModal.vue';

const route = useRoute();
const router = useRouter();
const { leaks, stats, loading, fetchLeaks, getLeakStats, acknowledgeLeak } = useLeaks();
const { addAsset } = useMonitoring();

const showAddModal = ref(false);
const filterSeverity = ref('all');
const filterAck = ref('all');

const filteredLeaks = computed(() => {
  let list = leaks.value;
  const assetFilter = route.query.asset;
  if (assetFilter) list = list.filter((l) => l.asset_id === assetFilter);
  if (filterSeverity.value !== 'all') list = list.filter((l) => l.severity === filterSeverity.value);
  if (filterAck.value === 'unack') list = list.filter((l) => !l.acknowledged);
  if (filterAck.value === 'ack') list = list.filter((l) => l.acknowledged);
  return list;
});

onMounted(async () => {
  await Promise.all([fetchLeaks(), getLeakStats()]);
});

async function onAddAsset(payload) {
  const r = await addAsset(payload);
  if (r) {
    showAddModal.value = false;
    await Promise.all([fetchLeaks(), getLeakStats()]);
  }
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function dataClassesText(arr) {
  if (!Array.isArray(arr) || !arr.length) return '—';
  return arr.slice(0, 3).join(', ') + (arr.length > 3 ? ` (+${arr.length - 3})` : '');
}
</script>

<template>
  <section class="dashboard-panel">
    <div class="monitoring-header">
      <div>
        <h1 class="dashboard-panel__title">Leaks &amp; breaches</h1>
        <p class="dashboard-panel__lead">
          Real-time detection of compromised emails, usernames and credentials linked to your monitored assets.
        </p>
      </div>
      <button type="button" class="btn btn--primary" @click="showAddModal = true">
        + Monitor asset
      </button>
    </div>

    <div v-if="stats" class="overview-kpis">
      <KpiCard
        label="Monitored assets"
        :value="stats.totalAssets"
        icon="◉"
        color="cyan"
      />
      <KpiCard
        label="Total leaks"
        :value="stats.totalLeaks"
        icon="⚠"
        :color="stats.totalLeaks > 0 ? 'danger' : 'success'"
      />
      <KpiCard
        label="Unacknowledged"
        :value="stats.unacknowledged"
        icon="◌"
        :color="stats.unacknowledged > 0 ? 'warning' : 'success'"
      />
      <KpiCard
        label="Passwords exposed"
        :value="stats.passwordsExposed"
        icon="🔓"
        :color="stats.passwordsExposed > 0 ? 'danger' : 'success'"
      />
    </div>

    <div class="findings-table__toolbar">
      <div class="findings-table__filters">
        <span class="filter-label">Severity:</span>
        <button
          v-for="s in ['all', 'critical', 'high', 'medium', 'low']"
          :key="s"
          type="button"
          class="findings-table__filter-btn"
          :class="{ 'is-active': filterSeverity === s }"
          @click="filterSeverity = s"
        >
          {{ s }}
        </button>
      </div>
      <div class="findings-table__filters">
        <span class="filter-label">Status:</span>
        <button
          v-for="s in ['all', 'unack', 'ack']"
          :key="s"
          type="button"
          class="findings-table__filter-btn"
          :class="{ 'is-active': filterAck === s }"
          @click="filterAck = s"
        >
          {{ s === 'unack' ? 'Unacknowledged' : s === 'ack' ? 'Acknowledged' : 'All' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="findings-table__loading">Loading leaks...</div>

    <div v-else-if="!filteredLeaks.length" class="watchlist-empty">
      <p v-if="!leaks.length">
        No leaks detected. Add an email or username to start monitoring.
      </p>
      <p v-else>No leaks match the current filters.</p>
      <button v-if="!leaks.length" type="button" class="btn btn--primary" @click="showAddModal = true">
        + Monitor asset
      </button>
    </div>

    <div v-else class="leak-list">
      <div
        v-for="l in filteredLeaks"
        :key="l.id"
        class="leak-card"
        :class="{ 'leak-card--ack': l.acknowledged }"
      >
        <div class="leak-card__header">
          <LeakBadge :severity="l.severity" :password-exposed="l.password_exposed" />
          <h3 class="leak-card__breach">{{ l.breach_name || l.source }}</h3>
          <span class="leak-card__time">{{ timeAgo(l.detected_at) }}</span>
        </div>

        <div class="leak-card__body">
          <div class="leak-card__row">
            <span class="leak-card__label">Asset:</span>
            <code class="leak-card__asset">
              {{ l.monitored_assets?.asset_value || '—' }}
            </code>
            <span v-if="l.monitored_assets?.asset_type" class="leak-card__type">
              ({{ l.monitored_assets.asset_type }})
            </span>
          </div>
          <div v-if="l.breach_date" class="leak-card__row">
            <span class="leak-card__label">Breach date:</span>
            <span>{{ l.breach_date }}</span>
          </div>
          <div v-if="l.data_classes?.length" class="leak-card__row">
            <span class="leak-card__label">Exposed data:</span>
            <span class="leak-card__data">{{ dataClassesText(l.data_classes) }}</span>
          </div>
          <div v-if="l.source" class="leak-card__row">
            <span class="leak-card__label">Source:</span>
            <span>{{ l.source }}</span>
          </div>
        </div>

        <div class="leak-card__footer">
          <button
            v-if="!l.acknowledged"
            type="button"
            class="btn btn--small"
            @click="acknowledgeLeak(l.id)"
          >
            Acknowledge
          </button>
          <span v-else class="leak-card__ack-badge">✓ Acknowledged</span>
        </div>
      </div>
    </div>

    <AssetAddModal
      v-if="showAddModal"
      default-type="email"
      @add="onAddAsset"
      @close="showAddModal = false"
    />
  </section>
</template>
