/**
 * HTTP client for the Oriradar oritypo-solver API.
 *
 * Endpoints used:
 *  - POST /v1/scans                          → create a scan { target } → ScanOut
 *  - GET  /v1/scans/{id}                     → poll scan status
 *  - GET  /v1/scans/{id}/screenshots/{file}  → screenshot files (used to build URLs)
 *
 * Base URL: import.meta.env.VITE_SCAN_API_BASE_URL (no trailing slash).
 */

import { supabase } from '@/lib/supabase.js';

export function getOriradarApiBase() {
  const b = import.meta.env.VITE_SCAN_API_BASE_URL;
  return typeof b === 'string' && b.trim() ? b.trim().replace(/\/$/, '') : '';
}

/**
 * Build an absolute screenshot URL from a finding's screenshot metadata.
 * The backend stores the file relative to ORI_SCREENSHOT_DIR/{scan_id}/{filename}.
 * If `screenshot.url` is already absolute (oriframe public URL), return as-is.
 */
export function screenshotUrl(scanId, screenshot) {
  if (!screenshot) return '';
  if (screenshot.url && /^https?:\/\//i.test(screenshot.url)) return screenshot.url;
  const file = screenshot.filename || screenshot.file;
  if (!file || !scanId) return '';
  const base = getOriradarApiBase();
  if (!base) return '';
  return `${base}/v1/scans/${encodeURIComponent(scanId)}/screenshots/${encodeURIComponent(file)}`;
}

/** Normalize a user input to a target accepted by the API (URL or hostname). */
export function normalizeTarget(input) {
  const s = String(input ?? '').trim();
  if (!s) return '';
  try {
    const u = /^https?:\/\//i.test(s) ? new URL(s) : new URL(`https://${s}`);
    return u.hostname || '';
  } catch {
    return '';
  }
}

/** POST /v1/scans { target } → ScanOut */
export async function createScan(target) {
  const base = getOriradarApiBase();
  if (!base) throw new Error('VITE_SCAN_API_BASE_URL is not set.');
  const host = normalizeTarget(target);
  if (!host) throw new Error('Invalid target hostname or URL.');
  const res = await fetch(`${base}/v1/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: host }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
  try { return JSON.parse(text); } catch { throw new Error('Invalid scan response (not JSON).'); }
}

/** GET /v1/scans/{id} → ScanOut */
export async function getScan(id) {
  const base = getOriradarApiBase();
  if (!base) throw new Error('VITE_SCAN_API_BASE_URL is not set.');
  const res = await fetch(`${base}/v1/scans/${encodeURIComponent(id)}`);
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
  return JSON.parse(text);
}

/**
 * Poll a scan until completion or timeout.
 * @param {string} id
 * @param {(scan: object) => void} [onTick]
 * @param {{ intervalMs?: number, maxMs?: number }} [options]
 */
export async function pollScan(id, onTick, options = {}) {
  const intervalMs = options.intervalMs ?? 2000;
  const maxMs = options.maxMs ?? 15 * 60 * 1000;
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const scan = await getScan(id);
    if (onTick) onTick(scan);
    if (scan.status === 'completed' || scan.status === 'failed') {
      return { scan, timedOut: false };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  const last = await getScan(id);
  return { scan: last, timedOut: true };
}

/** Convenience: createScan + pollScan in one call. */
export async function runScanWithPolling(target, onTick, options = {}) {
  const created = await createScan(target);
  if (onTick) onTick(created);
  return pollScan(created.id, onTick, options);
}

/** Map a numeric score to risk level (mirrors backend `risk_level_for_score`). */
export function riskLevelForScore(score) {
  const s = Number(score) || 0;
  if (s >= 80) return 'critical';
  if (s >= 60) return 'high';
  if (s >= 35) return 'medium';
  return 'low';
}

/**
 * Persist a completed scan into Supabase (scan_runs + scan_findings).
 * Idempotent-ish: safe to call once per completed scan.
 *
 * @param {object} params
 * @param {string} params.target           - apex / hostname
 * @param {object} params.scan             - ScanOut from the API (status='completed')
 * @param {string} [params.monitoredDomainId] - optional monitored_domains.id to link
 * @returns {Promise<{ runId: string | null, findingIds: string[] }>}
 */
export async function persistScanToSupabase({ target, scan, monitoredDomainId = null }) {
  if (!supabase) return { runId: null, findingIds: [] };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { runId: null, findingIds: [] };
  const userId = userData.user.id;

  let domainId = monitoredDomainId;
  if (!domainId && target) {
    const { data: existing } = await supabase
      .from('monitored_domains')
      .select('id')
      .eq('user_id', userId)
      .eq('canonical_hostname', String(target).toLowerCase())
      .maybeSingle();
    if (existing?.id) {
      domainId = existing.id;
    } else {
      const { data: created } = await supabase
        .from('monitored_domains')
        .insert({
          user_id: userId,
          canonical_hostname: String(target).toLowerCase(),
          display_url: `https://${target}`,
          is_active: true,
        })
        .select('id')
        .single();
      domainId = created?.id || null;
    }
  }
  if (!domainId) return { runId: null, findingIds: [] };

  const { data: run, error: runErr } = await supabase
    .from('scan_runs')
    .insert({
      user_id: userId,
      monitored_domain_id: domainId,
      status: scan.status === 'completed' ? 'completed' : 'failed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      summary: scan.summary || null,
      error_message: scan.error || null,
    })
    .select('id')
    .single();
  if (runErr || !run) return { runId: null, findingIds: [] };

  const findings = Array.isArray(scan.findings) ? scan.findings : [];
  if (!findings.length) return { runId: run.id, findingIds: [] };

  const rows = findings.map((f) => ({
    scan_run_id: run.id,
    variant_hostname: f.fqdn,
    risk_score: typeof f.score === 'number' ? f.score : null,
    signals: {
      kind: f.kind,
      distance: f.distance,
      registered: f.registered,
      risk_level: f.risk_level,
      reasons: f.reasons || [],
      prediction_score: f.prediction_score,
      prediction_level: f.prediction_level,
      prediction_reasons: f.prediction_reasons || [],
      dns: f.dns || {},
      http: f.http || null,
      rdap: f.rdap || null,
      crawl: f.crawl || null,
      screenshot: f.screenshot
        ? { ...f.screenshot, scan_id: scan.id }
        : null,
      similarity: f.similarity ?? null,
      favicon_match: f.favicon_match ?? false,
    },
  }));

  const { data: inserted, error: findingsErr } = await supabase
    .from('scan_findings')
    .insert(rows)
    .select('id');
  if (findingsErr) return { runId: run.id, findingIds: [] };
  return { runId: run.id, findingIds: (inserted || []).map((r) => r.id) };
}
