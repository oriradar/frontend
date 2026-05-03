<script setup>
defineProps({
  reasons: { type: Array, default: () => [] },
  score: { type: Number, default: 0 },
  level: { type: String, default: 'low' },
});
</script>

<template>
  <div class="score-breakdown">
    <div class="score-breakdown__header">
      <span class="score-breakdown__total" :class="`score-breakdown__total--${level}`">{{ score }}</span>
      <span class="score-breakdown__level">{{ level }}</span>
    </div>
    <ul v-if="reasons.length" class="score-breakdown__list">
      <li v-for="(reason, i) in reasons" :key="i" class="score-breakdown__item">
        {{ reason }}
      </li>
    </ul>
    <p v-else class="score-breakdown__empty">No scoring signals.</p>
  </div>
</template>
