<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RiskBadge from '@/components/RiskBadge.vue';
import ScoreBreakdown from '@/components/ScoreBreakdown.vue';
import { supabase } from '@/lib/supabase.js';
import { screenshotUrl, riskLevelForScore } from '@/composables/useOriradarApi.js';

const route = useRoute();
const router = useRouter();

const finding = ref(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  if (!supabase) {
    loading.value = false;
    error.value = 'Supabase is not configured.';
    return;
  }

  if (route.params.id) {
    const { data, error: err } = await supabase
      .from('scan_findings')
      .select('*, scan_runs(monitored_domain_id, created_at, status)')
      .eq('id', route.params.id)
      .single();
    loading.value = false;
    if (err) error.value = err.message;
    else finding.value = data;
    return;
  }

  loading.value = false;
  error.value = 'No finding selected.';
});

const signals = computed(() => finding.value?.signals || {});
const kind = computed(() => signals.value.kind || '—');
const reasons = computed(() => signals.value.reasons || []);
const predictionReasons = computed(() => signals.value.prediction_reasons || []);
const dns = computed(() => signals.value.dns || {});
const http = computed(() => signals.value.http || null);
const rdap = computed(() => signals.value.rdap || null);
const crawl = computed(() => signals.value.crawl || null);
const screenshot = computed(() => signals.value.screenshot || null);
const similarity = computed(() => signals.value.similarity);

const screenshotImgUrl = computed(() => {
  const sc = screenshot.value;
  if (!sc) return '';
  return screenshotUrl(sc.scan_id, sc);
});

function dnsList(type) {
  const arr = dns.value?.[type];
  return Array.isArray(arr) ? arr : [];
}

function kindShort(k) {
  return String(k || '').replace(/^orifold:/, '').replace(/^oricert:/, '');
}

function similarityLabel(s) {
  if (typeof s !== 'number') return '—';
  if (s >= 0.85) return `Very high (${s.toFixed(2)})`;
  if (s >= 0.65) return `High (${s.toFixed(2)})`;
  if (s >= 0.45) return `Moderate (${s.toFixed(2)})`;
  if (s >= 0.30) return `Low (${s.toFixed(2)})`;
  return `Very low (${s.toFixed(2)})`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}
</script>

<template>
  <section class="dashboard-panel">
    <button type="button" class="btn btn--ghost finding-back" @click="router.back()">
      ← Back
    </button>

    <div v-if="loading" class="finding-loading">Loading finding...</div>
    <div v-else-if="error" class="finding-error">{{ error }}</div>

    <template v-else-if="finding">
      <div class="finding-header">
        <div>
          <h1 class="finding-header__domain">{{ finding.variant_hostname }}</h1>
          <div class="finding-header__meta">
            <RiskBadge :level="signals.risk_level || riskLevelForScore(finding.risk_score || 0)" :score="finding.risk_score" />
            <span class="finding-header__kind">{{ kindShort(kind) }}</span>
            <span v-if="signals.distance != null" class="finding-header__distance">
              distance {{ signals.distance }}
            </span>
            <span v-if="signals.registered" class="finding-header__registered">registered</span>
          </div>
        </div>
        <div class="finding-header__actions">
          <a
            class="btn btn--small btn--ghost"
            :href="`https://${finding.variant_hostname}`"
            target="_blank"
            rel="noopener noreferrer"
          >Open ↗</a>
          <button type="button" class="btn btn--small btn--primary" disabled title="Phase 2 — coming soon">
            Initiate takedown
          </button>
        </div>
      </div>

      <div class="finding-grid">
        <!-- Risk score breakdown -->
        <div class="finding-card">
          <h2 class="finding-card__title">Current risk</h2>
          <ScoreBreakdown
            :score="finding.risk_score || 0"
            :level="signals.risk_level || riskLevelForScore(finding.risk_score || 0)"
            :reasons="reasons"
          />
        </div>

        <!-- Predictive risk (oriscore prediction) -->
        <div v-if="signals.prediction_score != null" class="finding-card">
          <h2 class="finding-card__title">Predictive risk (legitimacy)</h2>
          <ScoreBreakdown
            :score="signals.prediction_score || 0"
            :level="signals.prediction_level || riskLevelForScore(signals.prediction_score || 0)"
            :reasons="predictionReasons"
          />
        </div>

        <!-- DNS records -->
        <div class="finding-card">
          <h2 class="finding-card__title">DNS records</h2>
          <div class="finding-dns">
            <div v-for="type in ['A', 'AAAA', 'MX', 'NS', 'CNAME']" :key="type" class="finding-dns__group">
              <span class="finding-dns__type">{{ type }}</span>
              <div v-if="dnsList(type).length" class="finding-dns__values">
                <code v-for="(val, i) in dnsList(type)" :key="i">{{ val }}</code>
              </div>
              <span v-else class="finding-dns__empty">—</span>
            </div>
          </div>
        </div>

        <!-- HTTP probe -->
        <div v-if="http" class="finding-card">
          <h2 class="finding-card__title">HTTP probe (oriprobe)</h2>
          <div class="finding-http">
            <div class="finding-http__row">
              <span class="finding-http__label">Reachable</span>
              <span :class="http.reachable ? 'text-success' : 'text-danger'">
                {{ http.reachable ? 'Yes' : 'No' }}
              </span>
            </div>
            <div v-if="http.scheme" class="finding-http__row">
              <span class="finding-http__label">Scheme</span>
              <code>{{ http.scheme }}</code>
            </div>
            <div v-if="http.status_code" class="finding-http__row">
              <span class="finding-http__label">Status</span>
              <span>{{ http.status_code }}</span>
            </div>
            <div v-if="http.title" class="finding-http__row">
              <span class="finding-http__label">Title</span>
              <span>{{ http.title }}</span>
            </div>
            <div v-if="http.server" class="finding-http__row">
              <span class="finding-http__label">Server</span>
              <code>{{ http.server }}</code>
            </div>
            <div v-if="http.redirects" class="finding-http__row">
              <span class="finding-http__label">Redirects</span>
              <span>{{ http.redirects }}</span>
            </div>
            <div v-if="http.final_url" class="finding-http__row">
              <span class="finding-http__label">Final URL</span>
              <code>{{ http.final_url }}</code>
            </div>
            <div v-if="http.login_page" class="finding-http__row">
              <span class="finding-http__label">Login-like</span>
              <span class="text-danger">Yes — looks like a login page</span>
            </div>
            <div v-if="http.parking_page" class="finding-http__row">
              <span class="finding-http__label">Parking</span>
              <span class="text-success">Detected (parked / for sale)</span>
            </div>
            <div v-if="http.challenge_page" class="finding-http__row">
              <span class="finding-http__label">Challenge</span>
              <span>WAF / interstitial page</span>
            </div>
            <div v-if="http.favicon_hash" class="finding-http__row">
              <span class="finding-http__label">Favicon</span>
              <code>{{ http.favicon_hash }}</code>
              <span v-if="signals.favicon_match" class="text-danger">⚠ matches official site</span>
            </div>
            <div v-if="http.cert_sans?.length" class="finding-http__row">
              <span class="finding-http__label">TLS SANs</span>
              <div class="finding-http__chain">
                <code v-for="(s, i) in http.cert_sans.slice(0, 6)" :key="i">{{ s }}</code>
                <span v-if="http.cert_sans.length > 6">(+{{ http.cert_sans.length - 6 }} more)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RDAP / WHOIS -->
        <div v-if="rdap?.available" class="finding-card">
          <h2 class="finding-card__title">RDAP / WHOIS (orirdap)</h2>
          <div class="finding-http">
            <div v-if="rdap.registrar" class="finding-http__row">
              <span class="finding-http__label">Registrar</span>
              <span>{{ rdap.registrar }}</span>
            </div>
            <div v-if="rdap.registered_at" class="finding-http__row">
              <span class="finding-http__label">Registered</span>
              <span>{{ rdap.registered_at }}</span>
            </div>
            <div v-if="rdap.last_changed_at" class="finding-http__row">
              <span class="finding-http__label">Last changed</span>
              <span>{{ rdap.last_changed_at }}</span>
            </div>
            <div v-if="rdap.expires_at" class="finding-http__row">
              <span class="finding-http__label">Expires</span>
              <span>{{ rdap.expires_at }}</span>
            </div>
            <div v-if="rdap.country" class="finding-http__row">
              <span class="finding-http__label">Country</span>
              <span>{{ rdap.country }}</span>
            </div>
            <div v-if="rdap.statuses?.length" class="finding-http__row">
              <span class="finding-http__label">Statuses</span>
              <span>{{ rdap.statuses.join(', ') }}</span>
            </div>
          </div>
        </div>

        <!-- Crawl results -->
        <div v-if="crawl" class="finding-card finding-card--wide">
          <h2 class="finding-card__title">Crawled content (oricrawl)</h2>
          <div v-if="crawl.status === 'completed'" class="finding-crawl">
            <div class="finding-http__row">
              <span class="finding-http__label">Pages crawled</span>
              <span>{{ crawl.pages_crawled ?? '—' }}</span>
            </div>
            <div v-if="crawl.password_forms_count > 0" class="finding-crawl__alert">
              ⚠ {{ crawl.password_forms_count }} password form(s) detected — likely phishing
            </div>
            <div v-if="crawl.forms_count > 0 && !crawl.password_forms_count" class="finding-http__row">
              <span class="finding-http__label">Forms</span>
              <span>{{ crawl.forms_count }}</span>
            </div>
            <div v-if="crawl.login_urls?.length" class="finding-http__row">
              <span class="finding-http__label">Login URLs</span>
              <div class="finding-http__chain">
                <code v-for="(u, i) in crawl.login_urls.slice(0, 4)" :key="i">{{ u }}</code>
              </div>
            </div>
            <div v-if="crawl.payment_urls?.length" class="finding-http__row">
              <span class="finding-http__label">Payment URLs</span>
              <div class="finding-http__chain">
                <code v-for="(u, i) in crawl.payment_urls.slice(0, 4)" :key="i">{{ u }}</code>
              </div>
            </div>
            <div v-if="crawl.meta_brand_hits != null" class="finding-http__row">
              <span class="finding-http__label">Brand mentions</span>
              <span>{{ crawl.meta_brand_hits }} hit(s) in metadata</span>
            </div>
            <p v-if="crawl.content_snippet" class="finding-crawl__snippet">
              {{ crawl.content_snippet }}
            </p>
          </div>
          <p v-else class="finding-crawl__status">Crawl status: {{ crawl.status }}</p>

          <div v-if="typeof similarity === 'number'" class="finding-similarity">
            <h3 class="finding-similarity__title">Content similarity (orisim)</h3>
            <div class="similarity-bar">
              <div
                class="similarity-bar__fill"
                :class="{
                  'similarity-bar__fill--high': similarity >= 0.65,
                  'similarity-bar__fill--medium': similarity >= 0.45 && similarity < 0.65,
                  'similarity-bar__fill--low': similarity < 0.45,
                }"
                :style="{ width: Math.round(similarity * 100) + '%' }"
              />
            </div>
            <p class="finding-similarity__label">{{ similarityLabel(similarity) }}</p>
          </div>
        </div>

        <!-- Screenshot (oriframe) -->
        <div v-if="screenshot" class="finding-card finding-card--wide">
          <h2 class="finding-card__title">Screenshot (oriframe)</h2>
          <div v-if="screenshotImgUrl" class="finding-screenshot">
            <img :src="screenshotImgUrl" :alt="`Screenshot of ${finding.variant_hostname}`" loading="lazy" />
          </div>
          <p v-else class="finding-screenshot__status">
            Screenshot status: {{ screenshot.status }}
            <span v-if="screenshot.queued_at"> (queued {{ timeAgo(screenshot.queued_at) }})</span>
          </p>
        </div>
      </div>
    </template>
  </section>
</template>
