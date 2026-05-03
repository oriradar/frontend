<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase.js';
import { useAuthModal } from '@/composables/useAuthModal.js';
import { consumeAuthIntent } from '@/composables/useAuthIntent.js';
import countries from '@/data/countries.json';

const router = useRouter();
const { visible, view, close, showSignUp, showSignIn } = useAuthModal();

const signInEmail = ref('');
const signInPassword = ref('');
const signInFormError = ref('');

const signUpEmail = ref('');
const signUpPassword = ref('');
const signUpPasswordConfirm = ref('');
const signUpCountry = ref('');
const signUpCity = ref('');
const signUpCompany = ref('');
const heardFrom = ref('');
const signUpFormError = ref('');

watch(visible, (v) => {
  document.body.style.overflow = v ? 'hidden' : '';
  if (!v) {
    signInFormError.value = '';
    signUpFormError.value = '';
  }
});

function onBackdropClick() {
  close();
}

function onSignInSubmit(e) {
  e.preventDefault();
  signInFormError.value = '';
  if (!isSupabaseConfigured() || !supabase) {
    signInFormError.value =
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).';
    return;
  }
  supabase.auth
    .signInWithPassword({
      email: signInEmail.value.trim(),
      password: signInPassword.value
    })
    .then((res) => {
      if (res.error) {
        signInFormError.value = res.error.message;
        return;
      }
      close();
      const next = consumeAuthIntent();
      router.push(next);
    });
}

function onSignUpSubmit(e) {
  e.preventDefault();
  signUpFormError.value = '';
  if (signUpPassword.value !== signUpPasswordConfirm.value) {
    signUpFormError.value = 'Passwords do not match.';
    return;
  }
  if (!heardFrom.value) {
    signUpFormError.value = 'Please select how you found Oriradar.';
    return;
  }
  if (!isSupabaseConfigured() || !supabase) {
    signUpFormError.value =
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).';
    return;
  }
  supabase.auth
    .signUp({
      email: signUpEmail.value.trim(),
      password: signUpPassword.value,
      options: {
        data: {
          country: signUpCountry.value.trim(),
          city: signUpCity.value.trim(),
          company: signUpCompany.value.trim() || null,
          heard_from: heardFrom.value
        }
      }
    })
    .then((res) => {
      if (res.error) {
        signUpFormError.value = res.error.message;
        return;
      }
      if (res.data.session) {
        close();
        const next = consumeAuthIntent();
        router.push(next);
      } else {
        signUpFormError.value =
          'Check your email to confirm your account, then sign in.';
      }
    });
}

function onKeydown(e) {
  if (e.key === 'Escape' && visible.value) close();
}

onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div
    v-show="visible"
    class="modal"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="view === 'signin' ? 'signInTitle' : 'signUpTitle'"
  >
    <div class="modal__backdrop" tabindex="-1" @click="onBackdropClick" />
    <div
      class="modal__dialog"
      :class="{ 'modal__dialog--signup': view === 'signup' }"
      id="authModalDialog"
    >
      <button type="button" class="modal__close" aria-label="Close" @click="close">
        &times;
      </button>

      <div v-show="view === 'signin'" id="modalViewSignIn">
        <h2 class="modal__title" id="signInTitle">Sign in</h2>
        <form class="modal__form" @submit="onSignInSubmit">
          <label class="modal__label" for="signInEmail">Email</label>
          <input
            id="signInEmail"
            v-model="signInEmail"
            class="modal__input"
            type="email"
            name="email"
            autocomplete="email"
            required
          />
          <label class="modal__label" for="signInPassword">Password</label>
          <input
            id="signInPassword"
            v-model="signInPassword"
            class="modal__input"
            type="password"
            name="password"
            autocomplete="current-password"
            required
          />
          <p v-show="signInFormError" class="modal__error" role="alert">
            {{ signInFormError }}
          </p>
          <button type="submit" class="modal__submit">Sign in</button>
        </form>
        <p class="modal__footer">
          If you don’t have an account
          <button type="button" class="modal__link-btn" @click="showSignUp">Sign up</button>
        </p>
      </div>

      <div v-show="view === 'signup'" id="modalViewSignUp" class="modal__view--signup">
        <h2 class="modal__title" id="signUpTitle">Create account</h2>
        <form class="modal__form modal__form--signup" novalidate @submit="onSignUpSubmit">
          <label class="modal__label" for="signUpEmail">Email</label>
          <input
            id="signUpEmail"
            v-model="signUpEmail"
            class="modal__input"
            type="email"
            autocomplete="email"
            required
          />

          <label class="modal__label" for="signUpPassword">Password</label>
          <input
            id="signUpPassword"
            v-model="signUpPassword"
            class="modal__input"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
          />

          <label class="modal__label" for="signUpPasswordConfirm">Confirm password</label>
          <input
            id="signUpPasswordConfirm"
            v-model="signUpPasswordConfirm"
            class="modal__input"
            type="password"
            autocomplete="new-password"
            required
          />

          <div class="modal__row2">
            <div class="modal__field">
              <label class="modal__label" for="signUpCountry">Country</label>
              <select
                id="signUpCountry"
                v-model="signUpCountry"
                class="modal__input modal__input--select"
                autocomplete="country"
                required
              >
                <option value="">Select a country…</option>
                <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="modal__field">
              <label class="modal__label" for="signUpCity">City</label>
              <input
                id="signUpCity"
                v-model="signUpCity"
                class="modal__input"
                type="text"
                autocomplete="address-level2"
                required
              />
            </div>
          </div>

          <label class="modal__label" for="signUpCompany">
            Company name <span class="modal__optional">(optional)</span>
          </label>
          <input
            id="signUpCompany"
            v-model="signUpCompany"
            class="modal__input"
            type="text"
            autocomplete="organization"
          />

          <fieldset class="modal__choices">
            <legend class="modal__choices-legend">How did you find Oriradar?</legend>
            <div class="modal__choice-grid">
              <label class="modal__choice">
                <input v-model="heardFrom" type="radio" name="heard" value="social" required />
                <span class="modal__choice-text">Social media</span>
              </label>
              <label class="modal__choice">
                <input v-model="heardFrom" type="radio" name="heard" value="ai" />
                <span class="modal__choice-text">AI assistant</span>
              </label>
              <label class="modal__choice">
                <input v-model="heardFrom" type="radio" name="heard" value="search" />
                <span class="modal__choice-text">Web search</span>
              </label>
              <label class="modal__choice">
                <input v-model="heardFrom" type="radio" name="heard" value="wordofmouth" />
                <span class="modal__choice-text">Word of mouth</span>
              </label>
              <label class="modal__choice">
                <input v-model="heardFrom" type="radio" name="heard" value="other" />
                <span class="modal__choice-text">Other</span>
              </label>
            </div>
          </fieldset>

          <p v-show="signUpFormError" class="modal__error" role="alert">
            {{ signUpFormError }}
          </p>
          <button type="submit" class="modal__submit">Create account</button>
        </form>
        <p class="modal__footer">
          Already have an account?
          <button type="button" class="modal__link-btn" @click="showSignIn">Sign in</button>
        </p>
      </div>
    </div>
  </div>
</template>
