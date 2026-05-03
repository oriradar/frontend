<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RiskBadge from '@/components/RiskBadge.vue';
import { supabase } from '@/lib/supabase.js';
import { riskLevelForScore } from '@/composables/useOriradarApi.js';

const route = useRoute();
const router = useRouter();

const findings = ref([]);
const loading = ref(false);
const error = ref('');
const filter = ref('');
const riskFilter = ref('all');

const riskLevels = ['all', 'critical', 'high', 'medium', 'low'];

async function fetchFindings() {
  if (!supabase) return;
  loading.value = true;
  error.value = '';
  let query = supabase
    .from('scan_findings')
    .select('id, variant_hostname, risk_score, signals, created_at, scan_run_id, scan_runs(monitored_domain_id, created_at, monitored_domains(canonical_hostname))')
    .order('risk_score', { ascending: false })
    .limit(500);

  const domainQ = route.query.domain;
  if (typeof domainQ === 'string' && domainQ.trim()) {
    const { data: dom } = await supabase
      .from('monitored_domains')
      .select('id')
      .eq('canonical_hostname', domainQ.toLowerCase())
      .maybeSingle();
    if (dom?.id) {
      const { data: runs } = await supabase
        .from('scan_runs')
        .select('id')
        .eq('monitored_domain_id', dom.id)
        .order('created_at', { ascending: false })
        .limit(20);
      const runIds = (runs || []).map((r) => r.id);
      if (runIds.length) query = query.in('scan_run_id', runIds);
    }
  }

  const { data, error: err } = await query;
  loading.value = false;
  if (err) {
    error.value = err.message;
    return;
  }
  findings.value = data || [];
}

const filtered = computed(() => {
  let rows = findings.value;
  if (riskFilter.value !== 'all') {
    rows = rows.filter((f) => {
      const lvl = f.signals?.risk_level || riskLevelForScore(f.risk_score || 0);
      return lvl === riskFilter.value;
    });
  }
  const q = filter.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((f) => {
      const blob = [
        f.variant_hostname,
        f.signals?.kind,
        ...(f.signals?.reasons || []),
        ...(f.signals?.dns?.A || []),
        ...(f.signals?.dns?.MX || []),
        f.signals?.http?.title,
      ].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }
  return rows;
});

function dnsShort(dns, type) {
  const arr = dns?.[type];
  if (!Array.isArray(arr) || !arr.length) return '—';
  return arr.length > 2 ? `${arr.slice(0, 2).join(', ')} (+${arr.length - 2})` : arr.join(', ');
}

function httpStatus(http) {
  if (!http) return '—';
  if (http.reachable) return http.status_code || 'OK';
  return 'Down';
}

function kindShort(k) {
  return String(k || '').replace(/^orifold:/, '').replace(/^oricert:/, '');
}

function onSelect(f) {
  router.push({ name: 'dashboard-finding-detail', params: { id: f.id } });
}

onMounted(() => fetchFindings());
</script>

<template>
  <section class="dashboard-panel">
    <h1 class="dashboard-panel__title">Findings</h1>
    <p class="dashboard-panel__lead">
      All detected typosquatting variants across your monitored domains.
      <span v-if="route.query.domain"> Filtered for <code>{{ route.query.domain }}</code>.</span>
    </p>

    <div class="findings-table">
      <div class="findings-table__toolbar">
        <input
          v-model="filter"
          type="search"
          class="findings-table__search"
          placeholder="Search domain, kind, reasons..."
          autocomplete="off"
          spellcheck="false"
        />
        <div class="findings-table__filters">
          <button
            v-for="lvl in riskLevels"
            :key="lvl"
            type="button"
            class="findings-table__filter-btn"
            :class="{ 'is-active': riskFilter === lvl }"
            @click="riskFilter = lvl"
          >
            {{ lvl === 'all' ? 'All' : lvl }}
          </button>
        </div>
        <span class="findings-table__count">{{ filtered.length }} / {{ findings.length }}</span>
      </div>

      <p v-if="error" class="watchlist-error">{{ error }}</p>

      <div v-if="loading" class="findings-table__loading">Loading findings...</div>

      <div v-else-if="!findings.length" class="findings-table__empty">
        No findings yet. Run a scan from the
        <router-link :to="{ name: 'dashboard-scan' }">Scan page</router-link>.
      </div>

      <div v-else-if="!filtered.length" class="findings-table__empty">
        No findings match the current filters.
      </div>

      <div v-else class="findings-table__wrap">
        <table class="findings-table__table">
          <thead>
            <tr>
              <th>Risk</th>
              <th>Domain</th>
              <th>Kind</th>
              <th>Score</th>
              <th>A</th>
              <th>MX</th>
              <th>HTTP</th>
              <th>Title</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="f in filtered"
              :key="f.id"
              class="findings-table__row"
              @click="onSelect(f)"
            >
              <td>
                <RiskBadge
                  :level="f.signals?.risk_level || riskLevelForScore(f.risk_score || 0)"
                  :score="f.risk_score"
                />
              </td>
              <td class="findings-table__domain">
                <code>{{ f.variant_hostname }}</code>
              </td>
              <td>{{ kindShort(f.signals?.kind) }}</td>
              <td class="findings-table__score">{{ f.risk_score ?? '—' }}</td>
              <td class="findings-table__dns">{{ dnsShort(f.signals?.dns, 'A') }}</td>
              <td class="findings-table__dns">{{ dnsShort(f.signals?.dns, 'MX') }}</td>
              <td>{{ httpStatus(f.signals?.http) }}</td>
              <td class="findings-table__title">{{ f.signals?.http?.title || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
