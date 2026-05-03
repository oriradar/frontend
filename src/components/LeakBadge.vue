<script setup>
defineProps({
  severity: { type: String, default: 'medium' },
  passwordExposed: { type: Boolean, default: false },
});
</script>

<template>
  <span class="leak-badge" :class="`leak-badge--${severity}`">
    <span class="leak-badge__dot" />
    <span class="leak-badge__text">{{ severity }}</span>
    <span v-if="passwordExposed" class="leak-badge__pwd" title="Password exposed">🔓</span>
  </span>
</template>
