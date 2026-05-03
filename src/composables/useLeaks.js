import { ref } from 'vue';
import { supabase } from '@/lib/supabase.js';

const leaks = ref([]);
const stats = ref(null);
const loading = ref(false);
const error = ref('');

export function useLeaks() {
  async function fetchLeaks(assetId = null, limit = 100) {
    if (!supabase) return;
    loading.value = true;
    error.value = '';
    let query = supabase
      .from('leak_findings')
      .select('*, monitored_assets(asset_type, asset_value, label)')
      .order('detected_at', { ascending: false })
      .limit(limit);
    if (assetId) query = query.eq('asset_id', assetId);
    const { data, error: err } = await query;
    loading.value = false;
    if (err) { error.value = err.message; return; }
    leaks.value = data || [];
  }

  async function getLeakStats() {
    if (!supabase) return null;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;

    const [assetsRes, leaksRes] = await Promise.all([
      supabase.from('monitored_assets').select('id, asset_type, is_active').eq('user_id', userData.user.id),
      supabase.from('leak_findings').select('severity, password_exposed, acknowledged, detected_at').eq('user_id', userData.user.id),
    ]);

    const allAssets = assetsRes.data || [];
    const allLeaks = leaksRes.data || [];

    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    let unacknowledged = 0;
    let passwordsExposed = 0;
    for (const l of allLeaks) {
      breakdown[l.severity] = (breakdown[l.severity] || 0) + 1;
      if (!l.acknowledged) unacknowledged++;
      if (l.password_exposed) passwordsExposed++;
    }

    const assetsByType = { email: 0, username: 0, subdomain: 0, phone: 0 };
    for (const a of allAssets) {
      if (a.is_active) assetsByType[a.asset_type] = (assetsByType[a.asset_type] || 0) + 1;
    }

    stats.value = {
      totalAssets: allAssets.filter((a) => a.is_active).length,
      totalLeaks: allLeaks.length,
      unacknowledged,
      passwordsExposed,
      breakdown,
      assetsByType,
    };
    return stats.value;
  }

  async function acknowledgeLeak(id) {
    if (!supabase) return;
    const { error: err } = await supabase
      .from('leak_findings')
      .update({ acknowledged: true })
      .eq('id', id);
    if (err) { error.value = err.message; return; }
    const l = leaks.value.find((x) => x.id === id);
    if (l) l.acknowledged = true;
  }

  return { leaks, stats, loading, error, fetchLeaks, getLeakStats, acknowledgeLeak };
}
