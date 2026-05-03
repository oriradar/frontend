import { ref } from 'vue';
import { supabase } from '@/lib/supabase.js';

const domains = ref([]);
const loading = ref(false);
const error = ref('');

export function useWatchlist() {
  async function fetchDomains() {
    if (!supabase) return;
    loading.value = true;
    error.value = '';
    const { data, error: err } = await supabase
      .from('monitored_domains')
      .select('*')
      .order('created_at', { ascending: false });
    loading.value = false;
    if (err) {
      error.value = err.message;
      return;
    }
    domains.value = data || [];
  }

  async function addDomain(hostname) {
    if (!supabase) return null;
    error.value = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      error.value = 'Not authenticated';
      return null;
    }
    const { data, error: err } = await supabase
      .from('monitored_domains')
      .insert({
        user_id: userData.user.id,
        canonical_hostname: hostname.toLowerCase(),
        display_url: `https://${hostname}`,
        is_active: true,
      })
      .select()
      .single();
    if (err) {
      if (err.code === '23505') {
        error.value = 'This domain is already in your watchlist.';
      } else {
        error.value = err.message;
      }
      return null;
    }
    domains.value.unshift(data);
    return data;
  }

  async function removeDomain(id) {
    if (!supabase) return;
    error.value = '';
    const { error: err } = await supabase
      .from('monitored_domains')
      .delete()
      .eq('id', id);
    if (err) {
      error.value = err.message;
      return;
    }
    domains.value = domains.value.filter((d) => d.id !== id);
  }

  async function toggleActive(id, isActive) {
    if (!supabase) return;
    const { error: err } = await supabase
      .from('monitored_domains')
      .update({ is_active: isActive })
      .eq('id', id);
    if (err) {
      error.value = err.message;
      return;
    }
    const d = domains.value.find((d) => d.id === id);
    if (d) d.is_active = isActive;
  }

  return { domains, loading, error, fetchDomains, addDomain, removeDomain, toggleActive };
}
