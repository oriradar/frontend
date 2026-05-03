<script setup>
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
</script>

<template>
  <div class="subpage">
    <SiteHeader />
    <main class="subpage-main">
      <article class="legal-page wrap">
        <h1 class="legal-page__title">Privacy policy</h1>
        <p class="legal-page__meta">Last updated: March 25, 2025</p>

        <h2>Overview</h2>
        <p>
          This page describes how Oriradar collects, uses, and protects personal data when you use
          our website and services. Replace this text with a policy drafted for your legal framework
          (e.g. GDPR, CCPA) and your actual data practices.
        </p>

        <h2>Data we may collect</h2>
        <ul>
          <li>Account and contact information (email, name, company) when you register or contact us.</li>
          <li>
            Technical data such as IP address, browser type, and usage logs, as needed for security
            and analytics.
          </li>
          <li>Information you submit through forms or support channels.</li>
        </ul>

        <h2>How we use data</h2>
        <p>
          To provide and improve the service, communicate with you, comply with legal obligations,
          and ensure security. Describe retention periods and legal bases (e.g. contract, legitimate
          interest, consent) in your final version.
        </p>

        <h2>Cookies</h2>
        <p>
          Describe cookie categories (essential, analytics, marketing), how users can manage
          preferences, and link to a cookie banner or settings if applicable.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on your region, you may have rights to access, rectify, delete, or export your
          data, and to object to certain processing. Explain how users can exercise these rights and
          your contact point for privacy requests.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy inquiries:
          <a href="mailto:privacy@oriradar.example">privacy@oriradar.example</a> (replace with your
          real address).
        </p>
      </article>
    </main>
    <SiteFooter />
  </div>
</template>
