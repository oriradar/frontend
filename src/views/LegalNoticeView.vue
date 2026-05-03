<script setup>
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
</script>

<template>
  <div class="subpage">
    <SiteHeader />
    <main class="subpage-main">
      <article class="legal-page wrap">
        <h1 class="legal-page__title">Legal notice</h1>
        <p class="legal-page__meta">Last updated: March 25, 2025</p>

        <h2>Publisher</h2>
        <p>
          This website is published by Oriradar (the “Publisher”). Identification details (legal
          form, registered office, registration number, and contact email) must be completed
          according to your jurisdiction and company status.
        </p>

        <h2>Publication director</h2>
        <p>Name and role of the publication director to be indicated here.</p>

        <h2>Hosting</h2>
        <p>
          This site is hosted by [hosting provider name], [address], [country]. Contact: [hosting
          support URL or email].
        </p>

        <h2>Intellectual property</h2>
        <p>
          The Oriradar name, logo, visuals, and site content are protected by applicable intellectual
          property laws unless otherwise stated. Any reproduction or use without prior written consent
          is prohibited except for private viewing or as allowed by law.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          The Publisher strives to keep information accurate and up to date but gives no guarantee
          of completeness or fitness for a particular purpose. The Publisher may not be held liable
          for direct or indirect damage arising from use of this website or linked third-party sites.
        </p>

        <h2>Contact</h2>
        <p>
          For legal or administrative requests:
          <a href="mailto:legal@oriradar.example">legal@oriradar.example</a> (replace with your real
          address).
        </p>
      </article>
    </main>
    <SiteFooter />
  </div>
</template>
