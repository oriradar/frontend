<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabase.js';

const props = defineProps({
  defaultType: { type: String, default: 'email' },
});

const emit = defineEmits(['add', 'close']);

const assetType = ref(props.defaultType);
const assetValue = ref('');
const label = ref('');
const monitoredDomainId = ref('');
const error = ref('');
const domains = ref([]);

onMounted(async () => {
  if (!supabase) return;
  const { data } = await supabase
    .from('monitored_domains')
    .select('id, canonical_hostname')
    .order('canonical_hostname');
  domains.value = data || [];
});

function placeholderFor(type) {
  if (type === 'email') return 'user@example.com';
  if (type === 'username') return 'johndoe';
  if (type === 'subdomain') return 'app.example.com';
  if (type === 'phone') return '+33 6 12 34 56 78';
  return '';
}

function onSubmit() {
  error.value = '';
  if (!assetValue.value.trim()) {
    error.value = 'Value cannot be empty.';
    return;
  }
  emit('add', {
    asset_type: assetType.value,
    asset_value: assetValue.value,
    label: label.value || null,
    monitored_domain_id: monitoredDomainId.value || null,
  });
}
</script>

<template>
  <div class="modal" @click.self="emit('close')">
    <div class="modal__backdrop" @click="emit('close')" />
    <div class="modal__dialog">
      <button type="button" class="modal__close" @click="emit('close')">&times;</button>
      <h2 class="modal__title">Monitor an asset</h2>

      <form class="modal__form" @submit.prevent="onSubmit">
        <div class="modal__field">
          <label class="modal__label">Asset type</label>
          <div class="asset-type-tabs">
            <button
              v-for="t in ['email', 'username', 'subdomain', 'phone']"
              :key="t"
              type="button"
              class="asset-type-tab"
              :class="{ 'is-active': assetType === t }"
              @click="assetType = t"
            >
              {{ t }}
            </button>
          </div>
        </div>

        <div class="modal__field">
          <label class="modal__label" for="assetValue">Value</label>
          <input
            id="assetValue"
            v-model="assetValue"
            type="text"
            class="modal__input"
            :placeholder="placeholderFor(assetType)"
            autocomplete="off"
            spellcheck="false"
            autofocus
          />
        </div>

        <div class="modal__field">
          <label class="modal__label" for="assetLabel">Label <span class="modal__optional">(optional)</span></label>
          <input
            id="assetLabel"
            v-model="label"
            type="text"
            class="modal__input"
            placeholder="e.g. CEO email, marketing account..."
            autocomplete="off"
          />
        </div>

        <div v-if="domains.length" class="modal__field">
          <label class="modal__label" for="assetDomain">Linked domain <span class="modal__optional">(optional)</span></label>
          <select id="assetDomain" v-model="monitoredDomainId" class="modal__input modal__input--select">
            <option value="">— None —</option>
            <option v-for="d in domains" :key="d.id" :value="d.id">{{ d.canonical_hostname }}</option>
          </select>
        </div>

        <p v-if="error" class="modal__error">{{ error }}</p>
        <button type="submit" class="modal__submit">Start monitoring</button>
      </form>
    </div>
  </div>
</template>
