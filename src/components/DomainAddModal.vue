<script setup>
import { ref } from 'vue';

const emit = defineEmits(['add', 'close']);

const hostname = ref('');
const error = ref('');

function normalizeHostname(input) {
  let h = input.trim().toLowerCase();
  try {
    if (h.includes('://')) {
      h = new URL(h).hostname;
    } else if (h.includes('/')) {
      h = new URL('https://' + h).hostname;
    }
  } catch { /* keep as-is */ }
  h = h.replace(/^www\./, '');
  return h;
}

function onSubmit() {
  error.value = '';
  const h = normalizeHostname(hostname.value);
  if (!h || !h.includes('.') || h.length < 4) {
    error.value = 'Enter a valid domain (e.g. example.com)';
    return;
  }
  emit('add', h);
  hostname.value = '';
}
</script>

<template>
  <div class="modal" @click.self="emit('close')">
    <div class="modal__backdrop" @click="emit('close')" />
    <div class="modal__dialog">
      <button type="button" class="modal__close" @click="emit('close')">&times;</button>
      <h2 class="modal__title">Add domain to watchlist</h2>
      <form class="modal__form" @submit.prevent="onSubmit">
        <div class="modal__field">
          <label class="modal__label" for="addDomainInput">Domain or URL</label>
          <input
            id="addDomainInput"
            v-model="hostname"
            type="text"
            class="modal__input"
            placeholder="example.com or https://example.com"
            autocomplete="off"
            spellcheck="false"
            autofocus
          />
        </div>
        <p v-if="error" class="modal__error">{{ error }}</p>
        <button type="submit" class="modal__submit">Add to watchlist</button>
      </form>
    </div>
  </div>
</template>
