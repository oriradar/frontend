<script setup>
defineProps({
  level: { type: String, default: 'low' },
  score: { type: [Number, null], default: null },
});
</script>

<template>
  <span class="risk-badge" :class="`risk-badge--${level}`">
    <span class="risk-badge__dot" />
    <span class="risk-badge__text">{{ level }}</span>
    <span v-if="score !== null" class="risk-badge__score">{{ score }}</span>
  </span>
</template>
