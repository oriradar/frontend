import { ref } from 'vue';
import { supabase } from '@/lib/supabase.js';

const assets = ref([]);
const loading = ref(false);
const error = ref('');

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}

function normalizeUsername(v) {
  return String(v || '').trim().toLowerCase().replace(/^@/, '');
}

function normalizeSubdomain(v) {
  let s = String(v || '').trim().toLowerCase();
  try {
    if (s.includes('://')) s = new URL(s).hostname;
    else if (s.includes('/')) s = new URL('https://' + s).hostname;
  } catch { /* keep */ }
  return s.replace(/^www\./, '');
}

export function useMonitoring() {
  async function fetchAssets(typeFilter = null) {
    if (!supabase) return;
    loading.value = true;
    error.value = '';
    let query = supabase
      .from('monitored_assets')
      .select('*, monitored_domains(canonical_hostname)')
      .order('created_at', { ascending: false });
    if (typeFilter) query = query.eq('asset_type', typeFilter);
    const { data, error: err } = await query;
    loading.value = false;
    if (err) { error.value = err.message; return; }
    assets.value = data || [];
  }

  async function addAsset({ asset_type, asset_value, label, monitored_domain_id }) {
    if (!supabase) return null;
    error.value = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { error.value = 'Not authenticated'; return null; }

    let normalizedValue = asset_value;
    if (asset_type === 'email') normalizedValue = normalizeEmail(asset_value);
    else if (asset_type === 'username') normalizedValue = normalizeUsername(asset_value);
    else if (asset_type === 'subdomain') normalizedValue = normalizeSubdomain(asset_value);
    else normalizedValue = String(asset_value || '').trim().toLowerCase();

    if (!normalizedValue) { error.value = 'Empty value'; return null; }
    if (asset_type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
      error.value = 'Invalid email format';
      return null;
    }

    const { data, error: err } = await supabase
      .from('monitored_assets')
      .insert({
        user_id: userData.user.id,
        asset_type,
        asset_value: normalizedValue,
        label: label || null,
        monitored_domain_id: monitored_domain_id || null,
        is_active: true,
      })
      .select('*, monitored_domains(canonical_hostname)')
      .single();
    if (err) {
      if (err.code === '23505') error.value = 'This asset is already monitored.';
      else error.value = err.message;
      return null;
    }
    assets.value.unshift(data);
    return data;
  }

  async function removeAsset(id) {
    if (!supabase) return;
    const { error: err } = await supabase.from('monitored_assets').delete().eq('id', id);
    if (err) { error.value = err.message; return; }
    assets.value = assets.value.filter((a) => a.id !== id);
  }

  async function toggleAsset(id, isActive) {
    if (!supabase) return;
    const { error: err } = await supabase
      .from('monitored_assets')
      .update({ is_active: isActive })
      .eq('id', id);
    if (err) { error.value = err.message; return; }
    const a = assets.value.find((x) => x.id === id);
    if (a) a.is_active = isActive;
  }

  return { assets, loading, error, fetchAssets, addAsset, removeAsset, toggleAsset };
}
