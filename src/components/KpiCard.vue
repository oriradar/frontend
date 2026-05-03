<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '—' },
  icon: { type: String, default: '' },
  trend: { type: String, default: '' },
  color: { type: String, default: '' },
});
</script>

<template>
  <div class="kpi-card" :class="color ? `kpi-card--${color}` : ''">
    <div v-if="icon" class="kpi-card__icon" v-html="icon" />
    <div class="kpi-card__body">
      <span class="kpi-card__value">{{ value }}</span>
      <span class="kpi-card__label">{{ label }}</span>
    </div>
    <span v-if="trend" class="kpi-card__trend" :class="{ 'kpi-card__trend--up': trend.startsWith('+'), 'kpi-card__trend--down': trend.startsWith('-') }">
      {{ trend }}
    </span>
  </div>
</template>
