<script setup>
import { computed, ref } from 'vue';
import RiskBadge from './RiskBadge.vue';

const props = defineProps({
  findings: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);

const filter = ref('');
const riskFilter = ref('all');

const riskLevels = ['all', 'critical', 'high', 'medium', 'low'];

const filtered = computed(() => {
  let rows = props.findings;
  if (riskFilter.value !== 'all') {
    rows = rows.filter((f) => f.risk_level === riskFilter.value);
  }
  const q = filter.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((f) => {
      const blob = [f.fqdn, f.kind, f.risk_level, JSON.stringify(f.dns || {})]
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }
  return rows;
});

function httpStatus(f) {
  if (!f.http) return '—';
  if (f.http.reachable) return f.http.status_code || 'OK';
  return 'Down';
}

function dnsShort(dns, type) {
  const arr = dns?.[type];
  if (!Array.isArray(arr) || !arr.length) return '—';
  return arr.length > 2 ? `${arr.slice(0, 2).join(', ')} (+${arr.length - 2})` : arr.join(', ');
}
</script>

<template>
  <div class="findings-table">
    <div class="findings-table__toolbar">
      <input
        v-model="filter"
        type="search"
        class="findings-table__search"
        placeholder="Search domains, types..."
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

    <div v-if="loading" class="findings-table__loading">Scanning...</div>

    <div v-else-if="!findings.length" class="findings-table__empty">
      No findings yet. Run a scan from the watchlist.
    </div>

    <div v-else class="findings-table__wrap">
      <table class="findings-table__table">
        <thead>
          <tr>
            <th>Risk</th>
            <th>Domain</th>
            <th>Type</th>
            <th>Score</th>
            <th>A</th>
            <th>MX</th>
            <th>HTTP</th>
            <th>Title</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(f, i) in filtered"
            :key="f.fqdn + i"
            class="findings-table__row"
            @click="emit('select', f)"
          >
            <td><RiskBadge :level="f.risk_level || 'low'" :score="f.score" /></td>
            <td class="findings-table__domain">
              <code>{{ f.fqdn }}</code>
            </td>
            <td>{{ f.kind }}</td>
            <td class="findings-table__score">{{ f.score ?? '—' }}</td>
            <td class="findings-table__dns">{{ dnsShort(f.dns, 'A') }}</td>
            <td class="findings-table__dns">{{ dnsShort(f.dns, 'MX') }}</td>
            <td>{{ httpStatus(f) }}</td>
            <td class="findings-table__title">{{ f.http?.title || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
