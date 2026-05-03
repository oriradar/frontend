<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import KpiCard from '@/components/KpiCard.vue';
import RiskBadge from '@/components/RiskBadge.vue';
import LeakBadge from '@/components/LeakBadge.vue';
import TimelineEvent from '@/components/TimelineEvent.vue';
import { useScanRuns } from '@/composables/useScanRuns.js';
import { useWatchlist } from '@/composables/useWatchlist.js';
import { useLeaks } from '@/composables/useLeaks.js';
import { useMonitoring } from '@/composables/useMonitoring.js';

const router = useRouter();
const { getOverviewStats } = useScanRuns();
const { domains, fetchDomains } = useWatchlist();
const { leaks, getLeakStats, fetchLeaks } = useLeaks();
const { assets, fetchAssets } = useMonitoring();

const typoStats = ref(null);
const leakStats = ref(null);
const loading = ref(true);

onMounted(async () => {
  await Promise.all([
    fetchDomains(),
    fetchAssets(),
    fetchLeaks(),
  ]);
  [typoStats.value, leakStats.value] = await Promise.all([
    getOverviewStats(),
    getLeakStats(),
  ]);
  loading.value = false;
});

function riskLevel(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
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

function statusIcon(status) {
  if (status === 'completed') return '✓';
  if (status === 'running') return '◎';
  if (status === 'failed') return '✗';
  return '◌';
}

function statusColor(status) {
  if (status === 'completed') return 'success';
  if (status === 'running') return 'info';
  if (status === 'failed') return 'danger';
  return '';
}
</script>

<template>
  <section class="dashboard-panel">
    <h1 class="dashboard-panel__title">Overview</h1>
    <p class="dashboard-panel__lead">
      Real-time summary of your brand protection status — typosquatting, leaks and asset surveillance.
    </p>

    <div v-if="loading" class="overview-loading">Loading dashboard data...</div>

    <template v-else>
      <!-- Global KPI row -->
      <div class="overview-kpis">
        <KpiCard
          label="Domains monitored"
          :value="domains.length"
          icon="◉"
          color="cyan"
        />
        <KpiCard
          label="Assets monitored"
          :value="assets.length"
          icon="◈"
          color="cyan"
        />
        <KpiCard
          label="Active alerts"
          :value="(typoStats?.activeAlerts || 0) + (leakStats?.unacknowledged || 0)"
          icon="⚠"
          :color="((typoStats?.activeAlerts || 0) + (leakStats?.unacknowledged || 0)) > 0 ? 'danger' : 'success'"
        />
        <KpiCard
          label="Avg. risk score"
          :value="typoStats?.avgScore || 0"
          icon="▲"
          :color="(typoStats?.avgScore || 0) >= 60 ? 'danger' : (typoStats?.avgScore || 0) >= 35 ? 'warning' : 'success'"
        />
      </div>

      <!-- Two-column section: typosquat risk + leaks -->
      <div class="overview-grid">
        <div class="overview-card">
          <div class="overview-card__header">
            <h2 class="overview-card__title">Typosquat risk distribution</h2>
            <button type="button" class="btn btn--small btn--ghost" @click="router.push({ name: 'dashboard-findings' })">
              View findings
            </button>
          </div>
          <div v-if="typoStats?.totalFindings" class="risk-bars">
            <div class="risk-bar">
              <span class="risk-bar__label">Critical</span>
              <div class="risk-bar__track">
                <div class="risk-bar__fill risk-bar__fill--critical"
                  :style="{ width: (typoStats.riskBreakdown.critical / typoStats.totalFindings * 100) + '%' }" />
              </div>
              <span class="risk-bar__count">{{ typoStats.riskBreakdown.critical }}</span>
            </div>
            <div class="risk-bar">
              <span class="risk-bar__label">High</span>
              <div class="risk-bar__track">
                <div class="risk-bar__fill risk-bar__fill--high"
                  :style="{ width: (typoStats.riskBreakdown.high / typoStats.totalFindings * 100) + '%' }" />
              </div>
              <span class="risk-bar__count">{{ typoStats.riskBreakdown.high }}</span>
            </div>
            <div class="risk-bar">
              <span class="risk-bar__label">Medium</span>
              <div class="risk-bar__track">
                <div class="risk-bar__fill risk-bar__fill--medium"
                  :style="{ width: (typoStats.riskBreakdown.medium / typoStats.totalFindings * 100) + '%' }" />
              </div>
              <span class="risk-bar__count">{{ typoStats.riskBreakdown.medium }}</span>
            </div>
            <div class="risk-bar">
              <span class="risk-bar__label">Low</span>
              <div class="risk-bar__track">
                <div class="risk-bar__fill risk-bar__fill--low"
                  :style="{ width: (typoStats.riskBreakdown.low / typoStats.totalFindings * 100) + '%' }" />
              </div>
              <span class="risk-bar__count">{{ typoStats.riskBreakdown.low }}</span>
            </div>
          </div>
          <p v-else class="overview-card__empty">
            No findings yet.
            <router-link :to="{ name: 'dashboard-scan' }">Run a scan</router-link>
            to start.
          </p>
        </div>

        <div class="overview-card">
          <div class="overview-card__header">
            <h2 class="overview-card__title">Leak severity</h2>
            <button type="button" class="btn btn--small btn--ghost" @click="router.push({ name: 'dashboard-leaks' })">
              View leaks
            </button>
          </div>
          <div v-if="leakStats?.totalLeaks" class="risk-bars">
            <div class="risk-bar">
              <span class="risk-bar__label">Critical</span>
              <div class="risk-bar__track">
                <div class="risk-bar__fill risk-bar__fill--critical"
                  :style="{ width: (leakStats.breakdown.critical / leakStats.totalLeaks * 100) + '%' }" />
              </div>
              <span class="risk-bar__count">{{ leakStats.breakdown.critical }}</span>
            </div>
            <div class="risk-bar">
              <span class="risk-bar__label">High</span>
              <div class="risk-bar__track">
                <div class="risk-bar__fill risk-bar__fill--high"
                  :style="{ width: (leakStats.breakdown.high / leakStats.totalLeaks * 100) + '%' }" />
              </div>
              <span class="risk-bar__count">{{ leakStats.breakdown.high }}</span>
            </div>
            <div class="risk-bar">
              <span class="risk-bar__label">Medium</span>
              <div class="risk-bar__track">
                <div class="risk-bar__fill risk-bar__fill--medium"
                  :style="{ width: (leakStats.breakdown.medium / leakStats.totalLeaks * 100) + '%' }" />
              </div>
              <span class="risk-bar__count">{{ leakStats.breakdown.medium }}</span>
            </div>
            <div class="risk-bar">
              <span class="risk-bar__label">Low</span>
              <div class="risk-bar__track">
                <div class="risk-bar__fill risk-bar__fill--low"
                  :style="{ width: (leakStats.breakdown.low / leakStats.totalLeaks * 100) + '%' }" />
              </div>
              <span class="risk-bar__count">{{ leakStats.breakdown.low }}</span>
            </div>
          </div>
          <p v-else class="overview-card__empty">
            No leaks detected.
            <router-link :to="{ name: 'dashboard-monitoring' }">Add an asset</router-link>
            to start monitoring.
          </p>
        </div>
      </div>

      <!-- Activity timeline + Top threats -->
      <div class="overview-grid">
        <div class="overview-card">
          <h2 class="overview-card__title">Recent activity</h2>
          <div v-if="typoStats?.recentRuns?.length" class="overview-timeline">
            <TimelineEvent
              v-for="run in typoStats.recentRuns.slice(0, 6)"
              :key="run.id"
              :icon="statusIcon(run.status)"
              :title="`Scan ${run.status}`"
              :time="timeAgo(run.created_at)"
              :color="statusColor(run.status)"
            />
          </div>
          <p v-else class="overview-card__empty">No scans yet.</p>
        </div>

        <div class="overview-card">
          <div class="overview-card__header">
            <h2 class="overview-card__title">Top typosquat threats</h2>
            <button type="button" class="btn btn--small btn--ghost" @click="router.push({ name: 'dashboard-findings' })">
              All
            </button>
          </div>
          <div v-if="typoStats?.recentFindings?.length" class="overview-threats">
            <div
              v-for="f in typoStats.recentFindings.slice(0, 5)"
              :key="f.id || f.variant_hostname"
              class="threat-row"
              @click="router.push({ name: 'dashboard-finding-detail', params: { id: f.id } })"
            >
              <RiskBadge :level="riskLevel(f.risk_score || 0)" :score="f.risk_score" />
              <code class="threat-row__domain">{{ f.variant_hostname }}</code>
            </div>
          </div>
          <p v-else class="overview-card__empty">No findings yet.</p>
        </div>
      </div>

      <!-- Recent leaks -->
      <div v-if="leaks.length" class="overview-card">
        <div class="overview-card__header">
          <h2 class="overview-card__title">Recent leaks</h2>
          <button type="button" class="btn btn--small btn--ghost" @click="router.push({ name: 'dashboard-leaks' })">
            View all
          </button>
        </div>
        <div class="overview-leaks">
          <div
            v-for="l in leaks.slice(0, 5)"
            :key="l.id"
            class="overview-leak-row"
            @click="router.push({ name: 'dashboard-leaks', query: { asset: l.asset_id } })"
          >
            <LeakBadge :severity="l.severity" :password-exposed="l.password_exposed" />
            <code class="threat-row__domain">{{ l.monitored_assets?.asset_value || '—' }}</code>
            <span class="threat-row__score">{{ l.breach_name || l.source }}</span>
          </div>
        </div>
      </div>

      <!-- Watched domains -->
      <div class="overview-card">
        <div class="overview-card__header">
          <h2 class="overview-card__title">Monitored domains</h2>
          <button type="button" class="btn btn--small btn--ghost" @click="router.push({ name: 'dashboard-monitoring' })">
            Manage
          </button>
        </div>
        <div v-if="domains.length" class="overview-domains">
          <div v-for="d in domains.slice(0, 8)" :key="d.id" class="domain-chip">
            <span class="domain-chip__dot" :class="{ 'domain-chip__dot--active': d.is_active }" />
            <code>{{ d.canonical_hostname }}</code>
          </div>
          <span v-if="domains.length > 8" class="overview-domains__more">+{{ domains.length - 8 }} more</span>
        </div>
        <p v-else class="overview-card__empty">
          No domains monitored.
          <button type="button" class="btn btn--small" @click="router.push({ name: 'dashboard-monitoring' })">
            Add one
          </button>
        </p>
      </div>
    </template>
  </section>
</template>
