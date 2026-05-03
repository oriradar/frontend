<script setup>
import { RouterLink } from 'vue-router';

const year = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer">
    <div class="wrap">
      <p>© {{ year }} Oriradar</p>
      <div class="footer-links">
        <RouterLink to="/legal">Legal notice</RouterLink>
        <RouterLink to="/privacy">Privacy</RouterLink>
      </div>
    </div>
  </footer>
</template>
