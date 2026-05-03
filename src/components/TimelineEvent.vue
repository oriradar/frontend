<script setup>
defineProps({
  icon: { type: String, default: '●' },
  title: { type: String, required: true },
  time: { type: String, default: '' },
  detail: { type: String, default: '' },
  color: { type: String, default: '' },
});
</script>

<template>
  <div class="timeline-event">
    <span class="timeline-event__icon" :class="color ? `timeline-event__icon--${color}` : ''">{{ icon }}</span>
    <div class="timeline-event__body">
      <span class="timeline-event__title">{{ title }}</span>
      <span v-if="detail" class="timeline-event__detail">{{ detail }}</span>
    </div>
    <time v-if="time" class="timeline-event__time">{{ time }}</time>
  </div>
</template>
