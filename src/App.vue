<script setup>
import { RouterView } from 'vue-router';
import AuthModal from '@/components/AuthModal.vue';
import EmailVerificationBar from '@/components/EmailVerificationBar.vue';
</script>

<template>
  <EmailVerificationBar />
  <RouterView />
  <AuthModal />
</template>
