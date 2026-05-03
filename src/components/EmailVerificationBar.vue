<script setup>
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase.js';
import { useAuthSession } from '@/composables/useAuthSession.js';

const { session } = useAuthSession();

const resendLoading = ref(false);
const resendFeedback = ref('');
const resendIsError = ref(false);

const showBar = computed(() => {
  const u = session.value?.user;
  if (!u?.email) return false;
  // Email/password account pending email confirmation
  return !u.email_confirmed_at;
});

async function resendVerification() {
  if (!supabase || !session.value?.user?.email) return;
  resendFeedback.value = '';
  resendIsError.value = false;
  resendLoading.value = true;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: session.value.user.email,
    options: {
      emailRedirectTo: origin ? `${origin}/` : undefined
    }
  });
  resendLoading.value = false;
  if (error) {
    resendFeedback.value = error.message;
    resendIsError.value = true;
    return;
  }
  resendFeedback.value = 'Confirmation email sent. Check your inbox.';
  resendIsError.value = false;
}
</script>

<template>
  <div
    v-if="showBar"
    class="email-verify-bar"
    role="region"
    aria-label="Email verification"
  >
    <div class="email-verify-bar__inner wrap">
      <p class="email-verify-bar__text">
        <strong>Verify your email</strong>
        — your account works, but please confirm your address so we can reach you. We sent a link
        to <span class="email-verify-bar__email">{{ session?.user?.email }}</span>.
      </p>
      <div class="email-verify-bar__actions">
        <button
          type="button"
          class="email-verify-bar__btn"
          :disabled="resendLoading"
          @click="resendVerification"
        >
          {{ resendLoading ? 'Sending…' : 'Resend email' }}
        </button>
      </div>
    </div>
    <p
      v-if="resendFeedback"
      class="email-verify-bar__feedback wrap"
      :class="{ 'email-verify-bar__feedback--error': resendIsError }"
      role="status"
    >
      {{ resendFeedback }}
    </p>
  </div>
</template>
