<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useMapping } from '@/composables/useMapping.js';

const router = useRouter();
const { buildLiveGraph, loading } = useMapping();

const graph = ref({ nodes: [], edges: [] });
const filterType = ref('all');
const filterStatus = ref('all');
const selectedNode = ref(null);
const svgRef = ref(null);

const nodeTypes = ['all', 'domain', 'subdomain', 'email', 'username', 'variant'];
const statusTypes = ['all', 'safe', 'suspicious', 'compromised', 'unknown'];

const filteredNodes = computed(() => {
  let nodes = graph.value.nodes;
  if (filterType.value !== 'all') {
    nodes = nodes.filter((n) => n.type === filterType.value || (filterType.value === 'subdomain' && n.type === 'subdomain'));
  }
  if (filterStatus.value !== 'all') {
    nodes = nodes.filter((n) => n.status === filterStatus.value);
  }
  return nodes;
});

const layoutNodes = computed(() => {
  const nodes = filteredNodes.value;
  if (!nodes.length) return [];

  const domains = nodes.filter((n) => n.type === 'domain');
  const variants = nodes.filter((n) => n.type === 'variant');
  const emails = nodes.filter((n) => n.type === 'email');
  const usernames = nodes.filter((n) => n.type === 'username');
  const subdomains = nodes.filter((n) => n.type === 'subdomain');
  const others = nodes.filter((n) => !['domain', 'variant', 'email', 'username', 'subdomain'].includes(n.type));

  const positioned = [];
  const cw = 900;
  const ch = 600;

  domains.forEach((n, i) => {
    positioned.push({
      ...n,
      x: cw / 2 + (i - (domains.length - 1) / 2) * 220,
      y: ch / 2,
    });
  });

  variants.forEach((n, i) => {
    const angle = (i / Math.max(variants.length, 1)) * Math.PI;
    positioned.push({
      ...n,
      x: cw / 2 + Math.cos(angle) * 320,
      y: ch / 2 - Math.abs(Math.sin(angle)) * 200,
    });
  });

  emails.forEach((n, i) => {
    positioned.push({
      ...n,
      x: 120 + (i % 4) * 60,
      y: ch / 2 + 200 + Math.floor(i / 4) * 50,
    });
  });

  usernames.forEach((n, i) => {
    positioned.push({
      ...n,
      x: cw - 120 - (i % 4) * 60,
      y: ch / 2 + 200 + Math.floor(i / 4) * 50,
    });
  });

  subdomains.forEach((n, i) => {
    positioned.push({
      ...n,
      x: cw / 2 + (i - (subdomains.length - 1) / 2) * 100,
      y: ch / 2 + 250,
    });
  });

  others.forEach((n, i) => {
    positioned.push({
      ...n,
      x: 80 + (i % 6) * 80,
      y: 80,
    });
  });

  return positioned;
});

const layoutEdges = computed(() => {
  const nodeMap = new Map(layoutNodes.value.map((n) => [n.id, n]));
  return graph.value.edges
    .map((e) => {
      const s = nodeMap.get(e.source);
      const t = nodeMap.get(e.target);
      if (!s || !t) return null;
      return { ...e, x1: s.x, y1: s.y, x2: t.x, y2: t.y };
    })
    .filter(Boolean);
});

const stats = computed(() => {
  const all = graph.value.nodes;
  return {
    total: all.length,
    domains: all.filter((n) => n.type === 'domain').length,
    variants: all.filter((n) => n.type === 'variant').length,
    assets: all.filter((n) => ['email', 'username', 'subdomain'].includes(n.type)).length,
    compromised: all.filter((n) => n.status === 'compromised').length,
    suspicious: all.filter((n) => n.status === 'suspicious').length,
  };
});

onMounted(async () => {
  graph.value = await buildLiveGraph();
});

function nodeColor(node) {
  if (node.status === 'compromised') return '#e85d5d';
  if (node.status === 'suspicious') return '#e8b339';
  if (node.type === 'domain') return '#4fdafb';
  if (node.type === 'variant') return '#7a8fa6';
  if (node.type === 'email') return '#4fd4a0';
  if (node.type === 'username') return '#a78fdb';
  if (node.type === 'subdomain') return '#5cb8ff';
  return '#7a8fa6';
}

function nodeRadius(node) {
  if (node.type === 'domain') return 18;
  if (node.type === 'variant') return 10;
  return 8;
}

function selectNode(node) {
  selectedNode.value = node;
}
</script>

<template>
  <section class="dashboard-panel">
    <div class="monitoring-header">
      <div>
        <h1 class="dashboard-panel__title">Asset map</h1>
        <p class="dashboard-panel__lead">
          Visual graph of all your monitored domains, subdomains, emails, usernames and detected variants.
        </p>
      </div>
    </div>

    <div v-if="stats.total > 0" class="mapping-stats">
      <span class="mapping-stat"><b>{{ stats.total }}</b> nodes</span>
      <span class="mapping-stat mapping-stat--cyan">{{ stats.domains }} domains</span>
      <span class="mapping-stat mapping-stat--gray">{{ stats.variants }} variants</span>
      <span class="mapping-stat mapping-stat--green">{{ stats.assets }} assets</span>
      <span v-if="stats.compromised" class="mapping-stat mapping-stat--danger">{{ stats.compromised }} compromised</span>
      <span v-if="stats.suspicious" class="mapping-stat mapping-stat--warning">{{ stats.suspicious }} suspicious</span>
    </div>

    <div class="findings-table__toolbar">
      <div class="findings-table__filters">
        <span class="filter-label">Type:</span>
        <button
          v-for="t in nodeTypes"
          :key="t"
          type="button"
          class="findings-table__filter-btn"
          :class="{ 'is-active': filterType === t }"
          @click="filterType = t"
        >
          {{ t }}
        </button>
      </div>
      <div class="findings-table__filters">
        <span class="filter-label">Status:</span>
        <button
          v-for="s in statusTypes"
          :key="s"
          type="button"
          class="findings-table__filter-btn"
          :class="{ 'is-active': filterStatus === s }"
          @click="filterStatus = s"
        >
          {{ s }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="findings-table__loading">Building graph...</div>

    <div v-else-if="!graph.nodes.length" class="watchlist-empty">
      <p>No data to map yet.</p>
      <p>Add domains and assets to monitoring, then run scans to populate the map.</p>
      <button type="button" class="btn btn--primary" @click="router.push({ name: 'dashboard-monitoring' })">
        Go to Monitoring
      </button>
    </div>

    <div v-else class="mapping-canvas-wrap">
      <svg
        ref="svgRef"
        class="mapping-canvas"
        viewBox="0 0 900 700"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          v-for="(e, i) in layoutEdges"
          :key="`edge-${i}`"
          :x1="e.x1"
          :y1="e.y1"
          :x2="e.x2"
          :y2="e.y2"
          class="mapping-edge"
          :class="`mapping-edge--${e.type}`"
        />
        <g
          v-for="n in layoutNodes"
          :key="n.id"
          class="mapping-node"
          :class="{ 'mapping-node--selected': selectedNode?.id === n.id }"
          :transform="`translate(${n.x}, ${n.y})`"
          @click="selectNode(n)"
        >
          <circle
            :r="nodeRadius(n)"
            :fill="nodeColor(n)"
            :stroke="selectedNode?.id === n.id ? '#fff' : 'rgba(0,0,0,0.4)'"
            :stroke-width="selectedNode?.id === n.id ? 2 : 1"
          />
          <text
            :y="nodeRadius(n) + 14"
            text-anchor="middle"
            class="mapping-node__label"
          >
            {{ n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label }}
          </text>
        </g>
      </svg>

      <div v-if="selectedNode" class="mapping-detail">
        <button type="button" class="mapping-detail__close" @click="selectedNode = null">&times;</button>
        <span class="mapping-detail__type">{{ selectedNode.type }}</span>
        <code class="mapping-detail__label">{{ selectedNode.label }}</code>
        <div class="mapping-detail__meta">
          <span class="mapping-detail__status" :class="`mapping-detail__status--${selectedNode.status}`">
            {{ selectedNode.status }}
          </span>
          <span v-if="selectedNode.score" class="mapping-detail__score">Score: {{ selectedNode.score }}</span>
        </div>
        <div v-if="selectedNode.type === 'domain'" class="mapping-detail__actions">
          <button
            type="button"
            class="btn btn--small"
            @click="router.push({ name: 'dashboard-scan', query: { domain: `https://${selectedNode.label}` } })"
          >
            Run scan
          </button>
        </div>
      </div>
    </div>

    <div class="mapping-legend">
      <span class="mapping-legend__title">Legend</span>
      <span class="mapping-legend__item"><span class="mapping-legend__dot" style="background:#4fdafb" />Domain</span>
      <span class="mapping-legend__item"><span class="mapping-legend__dot" style="background:#7a8fa6" />Variant</span>
      <span class="mapping-legend__item"><span class="mapping-legend__dot" style="background:#4fd4a0" />Email</span>
      <span class="mapping-legend__item"><span class="mapping-legend__dot" style="background:#a78fdb" />Username</span>
      <span class="mapping-legend__item"><span class="mapping-legend__dot" style="background:#5cb8ff" />Subdomain</span>
      <span class="mapping-legend__item"><span class="mapping-legend__dot" style="background:#e85d5d" />Compromised</span>
      <span class="mapping-legend__item"><span class="mapping-legend__dot" style="background:#e8b339" />Suspicious</span>
    </div>
  </section>
</template>
