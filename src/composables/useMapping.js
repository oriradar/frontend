import { ref } from 'vue';
import { supabase } from '@/lib/supabase.js';

const nodes = ref([]);
const edges = ref([]);
const loading = ref(false);
const error = ref('');

export function useMapping() {
  async function fetchGraph() {
    if (!supabase) return;
    loading.value = true;
    error.value = '';
    const [nodesRes, edgesRes] = await Promise.all([
      supabase.from('mapping_nodes').select('*'),
      supabase.from('mapping_edges').select('*'),
    ]);
    loading.value = false;
    if (nodesRes.error) { error.value = nodesRes.error.message; return; }
    if (edgesRes.error) { error.value = edgesRes.error.message; return; }
    nodes.value = nodesRes.data || [];
    edges.value = edgesRes.data || [];
  }

  /**
   * Build a mapping snapshot from the user's actual data:
   * - root domain nodes from monitored_domains
   * - asset nodes (emails, usernames, subdomains) linked to root domain
   * - variant nodes from scan_findings
   * - leak nodes from leak_findings
   * Returns { nodes, edges } for in-memory rendering (does not persist).
   */
  async function buildLiveGraph() {
    if (!supabase) return { nodes: [], edges: [] };
    loading.value = true;
    error.value = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) { loading.value = false; return { nodes: [], edges: [] }; }
    const uid = userData.user.id;

    const [domsRes, assetsRes, runsRes, leaksRes] = await Promise.all([
      supabase.from('monitored_domains').select('*').eq('user_id', uid),
      supabase.from('monitored_assets').select('*').eq('user_id', uid),
      supabase.from('scan_runs').select('id, monitored_domain_id, scan_findings(variant_hostname, risk_score)').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
      supabase.from('leak_findings').select('id, asset_id, severity, breach_name, monitored_assets(asset_value)').eq('user_id', uid).limit(50),
    ]);

    const liveNodes = [];
    const liveEdges = [];

    for (const d of domsRes.data || []) {
      liveNodes.push({
        id: `domain-${d.id}`,
        type: 'domain',
        label: d.canonical_hostname,
        status: d.is_active ? 'safe' : 'unknown',
        ref_id: d.id,
      });
    }

    for (const a of assetsRes.data || []) {
      liveNodes.push({
        id: `asset-${a.id}`,
        type: a.asset_type,
        label: a.asset_value,
        status: 'safe',
        ref_id: a.id,
      });
      if (a.monitored_domain_id) {
        liveEdges.push({
          source: `domain-${a.monitored_domain_id}`,
          target: `asset-${a.id}`,
          type: 'belongs_to',
        });
      }
    }

    const seenVariants = new Set();
    for (const run of runsRes.data || []) {
      const findingsList = run.scan_findings || [];
      for (const f of findingsList) {
        const key = `variant-${f.variant_hostname}`;
        if (seenVariants.has(key)) continue;
        seenVariants.add(key);
        const score = f.risk_score || 0;
        const status = score >= 60 ? 'compromised' : score >= 35 ? 'suspicious' : 'safe';
        liveNodes.push({
          id: key,
          type: 'variant',
          label: f.variant_hostname,
          status,
          score,
        });
        if (run.monitored_domain_id) {
          liveEdges.push({
            source: `domain-${run.monitored_domain_id}`,
            target: key,
            type: 'variant_of',
          });
        }
      }
    }

    for (const l of leaksRes.data || []) {
      const node = liveNodes.find((n) => n.ref_id === l.asset_id);
      if (node) {
        node.status = 'compromised';
      }
    }

    loading.value = false;
    return { nodes: liveNodes, edges: liveEdges };
  }

  return { nodes, edges, loading, error, fetchGraph, buildLiveGraph };
}
