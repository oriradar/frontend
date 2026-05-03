import { ref } from 'vue';
import { supabase } from '@/lib/supabase.js';

const scanRuns = ref([]);
const findings = ref([]);
const loading = ref(false);
const error = ref('');

export function useScanRuns() {
  async function fetchRuns(monitoredDomainId = null, limit = 20) {
    if (!supabase) return;
    loading.value = true;
    error.value = '';
    let query = supabase
      .from('scan_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (monitoredDomainId) {
      query = query.eq('monitored_domain_id', monitoredDomainId);
    }
    const { data, error: err } = await query;
    loading.value = false;
    if (err) {
      error.value = err.message;
      return;
    }
    scanRuns.value = data || [];
  }

  async function fetchFindings(scanRunId) {
    if (!supabase) return;
    loading.value = true;
    error.value = '';
    const { data, error: err } = await supabase
      .from('scan_findings')
      .select('*')
      .eq('scan_run_id', scanRunId)
      .order('risk_score', { ascending: false });
    loading.value = false;
    if (err) {
      error.value = err.message;
      return;
    }
    findings.value = data || [];
  }

  async function fetchAllFindings(limit = 100) {
    if (!supabase) return;
    loading.value = true;
    error.value = '';
    const { data, error: err } = await supabase
      .from('scan_findings')
      .select('*, scan_runs!inner(monitored_domain_id, created_at)')
      .order('risk_score', { ascending: false })
      .limit(limit);
    loading.value = false;
    if (err) {
      error.value = err.message;
      return;
    }
    findings.value = data || [];
  }

  async function getOverviewStats() {
    if (!supabase) return null;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;
    const uid = userData.user.id;

    const [domainsRes, runsRes, findingsRes] = await Promise.all([
      supabase.from('monitored_domains').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('scan_runs').select('id, status, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
      supabase.from('scan_findings').select('risk_score, variant_hostname, scan_run_id, signals').order('risk_score', { ascending: false }).limit(200),
    ]);

    const totalDomains = domainsRes.count || 0;
    const recentRuns = runsRes.data || [];
    const allFindings = findingsRes.data || [];

    let critical = 0, high = 0, medium = 0, low = 0;
    for (const f of allFindings) {
      const s = f.risk_score ?? 0;
      if (s >= 80) critical++;
      else if (s >= 60) high++;
      else if (s >= 35) medium++;
      else low++;
    }

    const avgScore = allFindings.length
      ? Math.round(allFindings.reduce((sum, f) => sum + (f.risk_score || 0), 0) / allFindings.length)
      : 0;

    return {
      totalDomains,
      totalFindings: allFindings.length,
      totalScans: recentRuns.length,
      activeAlerts: critical + high,
      avgScore,
      riskBreakdown: { critical, high, medium, low },
      recentRuns,
      recentFindings: allFindings.slice(0, 10),
    };
  }

  return { scanRuns, findings, loading, error, fetchRuns, fetchFindings, fetchAllFindings, getOverviewStats };
}
