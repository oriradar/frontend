<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RiskBadge from '@/components/RiskBadge.vue';
import {
  getOriradarApiBase,
  runScanWithPolling,
  riskLevelForScore,
  persistScanToSupabase,
} from '@/composables/useOriradarApi.js';
import {
  getPendingScanDomain,
  setPendingScanDomain,
  clearPendingScanDomain,
} from '@/composables/usePendingScanDomain.js';
import { validateStrictDomainUrl } from '@/composables/useDomainValidation.js';

const route = useRoute();
const router = useRouter();

const manualInput = ref('');
const domainError = ref('');
const resolvedDomain = ref('');

const apiConfigured = computed(() => Boolean(getOriradarApiBase()));

const scanLoading = ref(false);
const scanError = ref('');
const currentScan = ref(null);
const tableFilter = ref('');
const riskFilter = ref('all');
const persistMessage = ref('');

const findings = computed(() => Array.isArray(currentScan.value?.findings) ? currentScan.value.findings : []);
const summary = computed(() => currentScan.value?.summary || null);

const filteredFindings = computed(() => {
  let rows = findings.value;
  if (riskFilter.value !== 'all') {
    rows = rows.filter((f) => (f.risk_level || riskLevelForScore(f.score)) === riskFilter.value);
  }
  const q = tableFilter.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((f) => {
      const blob = [
        f.fqdn,
        f.kind,
        f.risk_level,
        ...(f.reasons || []),
        ...(f.dns?.A || []),
        ...(f.dns?.MX || []),
        ...(f.dns?.NS || []),
        f.http?.title,
        f.http?.server,
      ].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }
  return rows;
});

const progressPct = computed(() => {
  if (!currentScan.value) return 0;
  const total = currentScan.value.progress_total || 0;
  const done = currentScan.value.progress_done || 0;
  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
});

function dnsShort(dns, type) {
  const arr = dns?.[type];
  if (!Array.isArray(arr) || !arr.length) return '—';
  return arr.length > 2 ? `${arr.slice(0, 2).join(', ')} (+${arr.length - 2})` : arr.join(', ');
}

function dnsTitle(dns, type) {
  const arr = dns?.[type];
  return Array.isArray(arr) ? arr.join('\n') : '';
}

function httpStatus(f) {
  if (!f.http) return '—';
  if (f.http.reachable) return f.http.status_code || 'OK';
  return 'Down';
}

function kindShort(kind) {
  if (!kind) return '—';
  return String(kind).replace(/^orifold:/, '').replace(/^oricert:/, '');
}

function resolveDomainFromSources() {
  const q = route.query.domain;
  if (typeof q === 'string' && q.trim()) {
    const v = validateStrictDomainUrl(q);
    if (v.ok) {
      const u = q.trim();
      setPendingScanDomain(u);
      return u;
    }
    domainError.value = v.message;
    return '';
  }
  return getPendingScanDomain();
}

function applyResolved(url) {
  resolvedDomain.value = url;
  manualInput.value = url;
  if (url) setPendingScanDomain(url);
}

onMounted(() => {
  applyResolved(resolveDomainFromSources());
});

watch(
  () => route.query.domain,
  () => {
    const d = resolveDomainFromSources();
    if (d || typeof route.query.domain !== 'string') domainError.value = '';
    applyResolved(d);
  }
);

function onManualApply() {
  domainError.value = '';
  scanError.value = '';
  const v = validateStrictDomainUrl(manualInput.value);
  if (!v.ok) {
    domainError.value = v.message;
    return;
  }
  applyResolved(manualInput.value.trim());
}

function clearStoredDomain() {
  clearPendingScanDomain();
  resolvedDomain.value = '';
  manualInput.value = '';
  currentScan.value = null;
  tableFilter.value = '';
  scanError.value = '';
  persistMessage.value = '';
}

async function onRunScan() {
  scanError.value = '';
  persistMessage.value = '';
  currentScan.value = null;
  tableFilter.value = '';
  if (!resolvedDomain.value) {
    scanError.value = 'Enter a domain to analyze.';
    return;
  }
  if (!apiConfigured.value) {
    scanError.value = 'VITE_SCAN_API_BASE_URL is not set (see .env).';
    return;
  }

  scanLoading.value = true;
  try {
    const result = await runScanWithPolling(resolvedDomain.value, (scan) => {
      currentScan.value = scan;
    });
    currentScan.value = result.scan;
    if (result.timedOut) {
      scanError.value = 'Maximum scan time exceeded. Partial results may be shown below.';
    } else if (result.scan.status === 'failed') {
      scanError.value = result.scan.error || 'Scan failed.';
    } else if (result.scan.status === 'completed') {
      try {
        const persisted = await persistScanToSupabase({
          target: resolvedDomain.value,
          scan: result.scan,
        });
        if (persisted.runId) {
          persistMessage.value = `Scan saved — ${persisted.findingIds.length} finding(s) persisted.`;
        }
      } catch (e) {
        persistMessage.value = `Scan completed but could not be saved: ${e.message || e}`;
      }
    }
  } catch (e) {
    scanError.value = e instanceof Error ? e.message : 'Scan failed (network or CORS).';
  } finally {
    scanLoading.value = false;
  }
}

function onSelectFinding(f) {
  if (!f) return;
  router.push({
    name: 'dashboard-finding-detail',
    query: { fqdn: f.fqdn, scan: currentScan.value?.id || '' },
  });
}
</script>

<template>
  <section class="dashboard-panel">
    <h1 class="dashboard-panel__title">Domain scan</h1>
    <p class="dashboard-panel__lead">
      Run a typosquat scan via the Oriradar engine (orifold + oriseek + oriprobe + oriscore).
      <router-link :to="{ name: 'dashboard-monitoring' }">Add this domain to monitoring</router-link>
      for continuous surveillance.
    </p>

    <div class="dashboard-scan__card dashboard-scan__card--wide">
      <label class="dashboard-scan__label" for="dashScanUrl">Domain or URL</label>
      <div class="dashboard-scan__row">
        <input
          id="dashScanUrl"
          v-model="manualInput"
          type="text"
          class="dashboard-scan__input"
          placeholder="https://example.com"
          autocomplete="off"
          spellcheck="false"
          :aria-invalid="domainError ? 'true' : 'false'"
          aria-describedby="dashScanErr"
          @keydown.enter.prevent="onManualApply"
        />
        <button type="button" class="btn dashboard-scan__btn-secondary" @click="onManualApply">
          Apply
        </button>
      </div>
      <p v-show="domainError" id="dashScanErr" class="dashboard-scan__err" role="alert">
        {{ domainError }}
      </p>
      <p v-if="resolvedDomain" class="dashboard-scan__resolved">
        <span class="dashboard-scan__muted">Active target:</span>
        <code class="dashboard-scan__code">{{ resolvedDomain }}</code>
        <button type="button" class="dashboard-scan__link" @click="clearStoredDomain">Clear</button>
      </p>

      <div class="dashboard-scan__api">
        <p class="dashboard-scan__muted">
          API:
          <template v-if="apiConfigured">
            <code class="dashboard-scan__code">{{ getOriradarApiBase() }}</code>
          </template>
          <template v-else>
            not set (env var <code class="dashboard-scan__code">VITE_SCAN_API_BASE_URL</code>)
          </template>
        </p>
        <button
          type="button"
          class="btn btn--primary"
          :disabled="scanLoading || !resolvedDomain || !apiConfigured"
          @click="onRunScan"
        >
          {{ scanLoading ? 'Scanning…' : 'Run scan' }}
        </button>
      </div>

      <p v-show="scanError" class="dashboard-scan__err" role="alert">{{ scanError }}</p>
      <p v-if="persistMessage" class="dashboard-scan__persist" role="status">{{ persistMessage }}</p>

      <div v-if="currentScan && currentScan.status !== 'completed'" class="scan-progress">
        <div class="scan-progress__head">
          <span class="scan-progress__status">Status: <b>{{ currentScan.status }}</b></span>
          <span class="scan-progress__count">{{ currentScan.progress_done }} / {{ currentScan.progress_total }}</span>
        </div>
        <div class="scan-progress__track">
          <div class="scan-progress__fill" :style="{ width: progressPct + '%' }" />
        </div>
      </div>

      <div v-if="summary" class="dashboard-scan__summary" aria-live="polite">
        <p class="dashboard-scan__summary-line">
          <strong>{{ summary.total_variants ?? findings.length }}</strong> variants generated —
          <strong>{{ findings.length }}</strong> findings —
          <strong>{{ summary.http_probed_count ?? 0 }}</strong> HTTP probed —
          <strong>{{ summary.rdap_lookup_count ?? 0 }}</strong> RDAP looked up
        </p>
      </div>

      <div v-if="findings.length" class="dashboard-scan__table-block">
        <div class="dashboard-scan__table-toolbar">
          <input
            v-model="tableFilter"
            type="search"
            class="dashboard-scan__table-filter"
            placeholder="Filter by domain, kind, reason, DNS…"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="findings-table__filters">
            <button
              v-for="lvl in ['all', 'critical', 'high', 'medium', 'low']"
              :key="lvl"
              type="button"
              class="findings-table__filter-btn"
              :class="{ 'is-active': riskFilter === lvl }"
              @click="riskFilter = lvl"
            >
              {{ lvl === 'all' ? 'All' : lvl }}
            </button>
          </div>
          <span class="dashboard-scan__table-count">
            {{ filteredFindings.length }} / {{ findings.length }}
          </span>
        </div>
        <div class="dashboard-scan__table-wrap" role="region" aria-label="Scan findings">
          <table class="dashboard-scan__table">
            <thead>
              <tr>
                <th>Risk</th>
                <th>Domain</th>
                <th>Kind</th>
                <th>Dist.</th>
                <th>A</th>
                <th>MX</th>
                <th>NS</th>
                <th>HTTP</th>
                <th>Title</th>
                <th>Reasons</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(f, idx) in filteredFindings"
                :key="f.fqdn + idx"
                class="findings-table__row"
                @click="onSelectFinding(f)"
              >
                <td><RiskBadge :level="f.risk_level || riskLevelForScore(f.score)" :score="f.score" /></td>
                <td>
                  <div class="dashboard-scan__domain-cell">
                    <a
                      class="dashboard-scan__table-external"
                      :href="`https://${f.fqdn}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      :aria-label="`Open ${f.fqdn} in a new tab`"
                      @click.stop
                    >↗</a>
                    <code class="dashboard-scan__table-domain">{{ f.fqdn }}</code>
                  </div>
                </td>
                <td>{{ kindShort(f.kind) }}</td>
                <td>{{ f.distance ?? '—' }}</td>
                <td class="dashboard-scan__table-mono" :title="dnsTitle(f.dns, 'A')">{{ dnsShort(f.dns, 'A') }}</td>
                <td class="dashboard-scan__table-mono" :title="dnsTitle(f.dns, 'MX')">{{ dnsShort(f.dns, 'MX') }}</td>
                <td class="dashboard-scan__table-mono" :title="dnsTitle(f.dns, 'NS')">{{ dnsShort(f.dns, 'NS') }}</td>
                <td>{{ httpStatus(f) }}</td>
                <td class="dashboard-scan__table-title" :title="f.http?.title || ''">
                  {{ f.http?.title ? (f.http.title.length > 48 ? f.http.title.slice(0, 47) + '…' : f.http.title) : '—' }}
                </td>
                <td class="dashboard-scan__reasons" :title="(f.reasons || []).join(' · ')">
                  {{ (f.reasons || []).slice(0, 2).join(' · ') || '—' }}
                  <span v-if="(f.reasons || []).length > 2" class="dashboard-scan__reasons-more">
                    (+{{ (f.reasons || []).length - 2 }})
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <details v-if="currentScan" class="dashboard-scan__details">
        <summary>Raw scan response</summary>
        <pre class="dashboard-scan__pre">{{ JSON.stringify(currentScan, null, 2) }}</pre>
      </details>
    </div>
  </section>
</template>
