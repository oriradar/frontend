import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase.js';

const session = ref(null);
const loading = ref(true);

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession;
    loading.value = false;
  });
  setTimeout(() => { loading.value = false; }, 3000);
} else {
  loading.value = false;
}

export function useAuthSession() {
  const isLoggedIn = computed(() => Boolean(session.value));
  return { session, loading, isLoggedIn };
}
