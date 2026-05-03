<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabase.js';

const subscriptionHtml = ref('');

function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

async function loadSubscription() {
  if (!supabase) return;
  subscriptionHtml.value = 'Loading subscription…';
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    subscriptionHtml.value = 'Could not load user.';
    return;
  }
  const q = await supabase
    .from('subscriptions')
    .select('plan_slug, status, extra_domains_count')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (q.error) {
    subscriptionHtml.value = 'Could not load subscription: ' + q.error.message;
    return;
  }
  if (q.data) {
    const s = q.data;
    subscriptionHtml.value =
      '<p><strong>Plan:</strong> ' +
      escapeHtml(s.plan_slug) +
      '</p><p><strong>Status:</strong> ' +
      escapeHtml(s.status) +
      '</p><p><strong>Extra domains:</strong> ' +
      String(s.extra_domains_count) +
      '</p>';
  } else {
    subscriptionHtml.value = 'No subscription row found.';
  }
}

onMounted(() => loadSubscription());
</script>

<template>
  <section class="dashboard-panel">
    <h1 class="dashboard-panel__title">Settings — Billing</h1>
    <p class="dashboard-panel__lead">
      Manage your plan and payment method (Stripe integration later).
    </p>
    <div class="dashboard-subscription" aria-live="polite" v-html="subscriptionHtml" />
  </section>
</template>
