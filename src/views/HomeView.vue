<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import { useAuthModal } from '@/composables/useAuthModal.js';
import { setPendingScanDomain } from '@/composables/usePendingScanDomain.js';
import { validateStrictDomainUrl } from '@/composables/useDomainValidation.js';
import { supabase } from '@/lib/supabase.js';

import iconShield from '@/assets/icons/origami-shield-32x32.svg';
import iconAlert from '@/assets/icons/origami-alert-32x32.svg';
import iconRisk from '@/assets/icons/origami-risk-score-32x32.svg';
import iconDashboard from '@/assets/icons/origami-dashboard-32x32.svg';
import iconMonitoring from '@/assets/icons/origami-monitoring-32x32.svg';

const router = useRouter();
const { open } = useAuthModal();

const domainInput = ref('');
const scanDomainError = ref('');

function clearScanDomainError() {
  scanDomainError.value = '';
}

function showScanDomainError(msg) {
  scanDomainError.value = msg;
}

async function onScanSubmit() {
  const v = validateStrictDomainUrl(domainInput.value);
  if (!v.ok) {
    showScanDomainError(v.message);
    return;
  }
  clearScanDomainError();
  const url = domainInput.value.trim();
  setPendingScanDomain(url);

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      router.push({ name: 'dashboard-scan' });
      return;
    }
  }
  open('scan');
}

const BASE_TACTICAL = 46;
const CORE_UNIT = 14;
const EXTRA_PER_DOMAIN = 2 * CORE_UNIT * 0.85;
const maxExtra = 5;
const extra = ref(0);

const tacticalTotal = ref('€46.00');
const tacticalDetail = ref('1 domain included in the €46/mo base.');

function euros(n) {
  return '€' + n.toFixed(2);
}

function updateTactical() {
  const e = extra.value;
  const total = BASE_TACTICAL + e * EXTRA_PER_DOMAIN;
  tacticalTotal.value = euros(total);
  const domains = 1 + e;
  const extraLine = euros(EXTRA_PER_DOMAIN);
  if (e === 0) {
    tacticalDetail.value = '1 domain included in the €46/mo base.';
  } else {
    tacticalDetail.value =
      domains +
      ' domains total — €' +
      BASE_TACTICAL +
      ' base + ' +
      e +
      ' × ' +
      extraLine +
      ' (2× €' +
      CORE_UNIT +
      ' −15%).';
  }
}

function extraUp() {
  if (extra.value < maxExtra) {
    extra.value += 1;
    updateTactical();
  }
}

function extraDown() {
  if (extra.value > 0) {
    extra.value -= 1;
    updateTactical();
  }
}

function onPricingGridClick(e) {
  const a = e.target.closest('a.price-card__cta');
  if (!a || a.classList.contains('price-card__cta--outline')) return;
  if (a.getAttribute('href') !== '#') return;
  e.preventDefault();
  const plan = a.getAttribute('data-plan');
  open('pricing', plan);
}

function centerPricingOnMobile() {
  const grid = document.querySelector('.pricing__grid');
  if (grid && window.innerWidth <= 900) {
    const cards = grid.querySelectorAll('.price-card');
    if (cards.length >= 2) {
      const middleCard = cards[1];
      const scrollLeft =
        middleCard.offsetLeft - grid.clientWidth / 2 + middleCard.clientWidth / 2;
      grid.scrollLeft = scrollLeft;
    }
  }
}

onMounted(() => {
  updateTactical();
  centerPricingOnMobile();
  window.addEventListener('load', centerPricingOnMobile);
  window.addEventListener('resize', centerPricingOnMobile);
});

onUnmounted(() => {
  window.removeEventListener('load', centerPricingOnMobile);
  window.removeEventListener('resize', centerPricingOnMobile);
});
</script>

<template>
  <div>
    <div class="hero-banner" id="top">
      <SiteHeader />
      <section class="hero" id="scan">
        <div class="wrap">
          <h1 class="hero__title">Someone is copying your domain right now.</h1>
          <p class="hero__lead">
            Every quarter, over a million phishing attempts are detected and the ones that slip
            under the radar remain unknown.
          </p>

          <div class="scan-panel">
            <label class="scan-panel__label" for="domainInput">Domain to analyze</label>
            <div class="scan-row">
              <input
                id="domainInput"
                v-model="domainInput"
                type="text"
                name="domain"
                placeholder="https://example.com"
                autocomplete="off"
                spellcheck="false"
                autofocus
                aria-describedby="scanDomainError"
                @input="clearScanDomainError"
                @keydown.enter.prevent="onScanSubmit"
              />
              <button type="button" class="btn btn--primary" @click="onScanSubmit">Run scan</button>
            </div>
            <p
              v-show="scanDomainError"
              id="scanDomainError"
              class="scan-error"
              role="alert"
            >
              {{ scanDomainError }}
            </p>
            <p class="scan-hint">
              Tip: use a full URL (<kbd>http://</kbd> or <kbd>https://</kbd>), domain and TLD
              only, then press <kbd>Enter</kbd> or Run scan.
            </p>
          </div>
        </div>
      </section>
    </div>

    <main>
      <section id="features">
        <div class="wrap">
          <header class="features-header">
            <p class="features-eyebrow">Features</p>
            <h2 class="section-title features-headline">
              Every variant tracked,<br />every threat exposed.
            </h2>
            <p class="features-intro-text">
              Our engine generates and verifies thousands of permutations of your domain by
              combining more than 15 detection techniques with real-time DNS and content analysis.
            </p>
          </header>

          <div class="features-bento">
            <article class="feature-card bento-large">
              <div class="feature-card__icon" aria-hidden="true">
                <img
                  class="feature-card__icon-img"
                  :src="iconShield"
                  alt=""
                  width="32"
                  height="32"
                  decoding="async"
                />
              </div>
              <div class="feature-card__content">
                <h3>Multi-method detection</h3>
                <p>
                  Homoglyphs, transposition, omission, insertion, bit-flipping, and more than 15
                  combined techniques for exhaustive coverage.
                </p>
              </div>
            </article>

            <article class="feature-card">
              <div class="feature-card__icon" aria-hidden="true">
                <img
                  class="feature-card__icon-img"
                  :src="iconAlert"
                  alt=""
                  width="32"
                  height="32"
                  decoding="async"
                />
              </div>
              <div class="feature-card__content">
                <h3>Real-time alerts</h3>
                <p>
                  Instant notifications by email or webhook as soon as a suspicious domain is
                  registered or changes behavior.
                </p>
              </div>
            </article>

            <article class="feature-card">
              <div class="feature-card__icon" aria-hidden="true">
                <img
                  class="feature-card__icon-img"
                  :src="iconRisk"
                  alt=""
                  width="32"
                  height="32"
                  decoding="async"
                />
              </div>
              <div class="feature-card__content">
                <h3>Intelligent risk scoring</h3>
                <p>
                  Each domain receives a score based on DNS activity, hosted content, age, and
                  visual similarity to your brand.
                </p>
              </div>
            </article>

            <article class="feature-card">
              <div class="feature-card__icon" aria-hidden="true">
                <img
                  class="feature-card__icon-img"
                  :src="iconDashboard"
                  alt=""
                  width="32"
                  height="32"
                  decoding="async"
                />
              </div>
              <div class="feature-card__content">
                <h3>Centralized dashboard</h3>
                <p>
                  Overview of all your threats with filters, history, and PDF export for your legal
                  teams.
                </p>
              </div>
            </article>

            <article class="feature-card">
              <div class="feature-card__icon" aria-hidden="true">
                <img
                  class="feature-card__icon-img"
                  :src="iconMonitoring"
                  alt=""
                  width="32"
                  height="32"
                  decoding="async"
                />
              </div>
              <div class="feature-card__content">
                <h3>24/7 monitoring</h3>
                <p>
                  Continuous scans tailored to your plan. From weekly to real-time, your brand is
                  monitored around the clock.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="pricing" class="pricing">
        <div class="wrap">
          <header class="pricing__header">
            <h2 class="section-title">Pricing</h2>
            <p class="section-lead">
              Choose the coverage that matches your risk surface. All plans include a
              <strong>14-day free trial</strong>.
            </p>
          </header>

          <div class="pricing__grid" @click="onPricingGridClick">
            <article class="price-card price-card--popular">
              <span class="price-card__badge">Popular</span>
              <p class="price-card__trial">14-day free trial</p>
              <h3 class="price-card__name">Core Shield</h3>
              <p class="price-card__price">
                <span class="price-card__currency">€</span>14<span class="price-card__period">/mo</span>
              </p>
              <p class="price-card__desc">For freelancers and small businesses that want peace of mind.</p>
              <ul class="price-card__list">
                <li>1 domain monitored</li>
                <li>Daily scan</li>
                <li>15+ detection methods</li>
                <li>Real-time email alerts</li>
                <li>Automatic screenshots</li>
                <li>PDF reports</li>
                <li>Monitoring dashboard</li>
              </ul>
              <a class="price-card__cta" href="#" data-plan="core-shield">Get started</a>
            </article>

            <article class="price-card">
              <h3 class="price-card__name">Tactical Defense</h3>
              <p class="price-card__price">
                <span class="price-card__currency">€</span>46<span class="price-card__period">/mo</span>
                <span class="price-card__price-note">base</span>
              </p>
              <p class="price-card__desc">For teams and companies protecting multiple brands.</p>

              <div id="tacticalWidget" class="price-card__widget">
                <label class="price-card__widget-label" for="extraDomains">Extra domains (max 5)</label>
                <div class="price-card__stepper">
                  <button
                    type="button"
                    class="stepper-btn"
                    aria-label="Remove domain"
                    :disabled="extra <= 0"
                    @click="extraDown"
                  >
                    −
                  </button>
                  <span class="stepper-value">{{ extra }}</span>
                  <button
                    type="button"
                    class="stepper-btn"
                    aria-label="Add domain"
                    :disabled="extra >= maxExtra"
                    @click="extraUp"
                  >
                    +
                  </button>
                </div>
                <p id="tacticalDetail" class="price-card__widget-detail">{{ tacticalDetail }}</p>
                <p class="price-card__total">
                  <span id="tacticalTotalLabel">Your price</span>:
                  <strong id="tacticalTotal">{{ tacticalTotal }}</strong
                  ><span class="price-card__period">/mo</span>
                </p>
                <p id="tacticalFineprint" class="price-card__fineprint">
                  Each extra domain: 2× Core Shield (€14) with <strong>15% off</strong> →
                  <strong>€23.80</strong>/mo per domain.
                </p>
              </div>

              <p class="price-card__includes">Everything in <strong>Core Shield</strong>, plus:</p>
              <ul class="price-card__list">
                <li>More domains monitored (see calculator)</li>
                <li>Daily scan</li>
                <li>All detection methods</li>
                <li>Email + webhook alerts</li>
                <li>Multi-user access</li>
                <li>Priority support</li>
                <li>Deep exploration of phishing-related domains</li>
                <li>Image &amp; source comparison for potential phishing sites</li>
              </ul>
              <a class="price-card__cta" href="#" data-plan="tactical-defense">Get started</a>
            </article>

            <article class="price-card price-card--enterprise">
              <h3 class="price-card__name">Strategic Command</h3>
              <p class="price-card__price price-card__price--custom">Tailored</p>
              <p class="price-card__desc">Maximum control for large-scale brand and fraud operations.</p>
              <p class="price-card__includes">Everything in <strong>Tactical Defense</strong>, plus:</p>
              <ul class="price-card__list">
                <li><strong>Domain takedowns</strong> — remove domains that infringe your brand</li>
                <li><strong>Dedicated CTI team</strong></li>
                <li>Automatic alerts</li>
                <li>Dedicated takedown / strike assistance</li>
              </ul>
              <a class="price-card__cta price-card__cta--outline" href="mailto:sales@oriradar.example">Talk to sales</a>
            </article>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
