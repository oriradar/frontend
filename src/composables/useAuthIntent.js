const AUTH_INTENT_KEY = 'oriradar.authIntent';

export function setAuthIntent(source, plan) {
  try {
    sessionStorage.setItem(
      AUTH_INTENT_KEY,
      JSON.stringify({ source: source || 'default', plan: plan || null })
    );
  } catch (_) {}
}

/** Default (Sign in in header, etc.) → dashboard overview. */
const DASHBOARD_OVERVIEW = { name: 'dashboard-overview' };

export function consumeAuthIntent() {
  const raw = sessionStorage.getItem(AUTH_INTENT_KEY);
  sessionStorage.removeItem(AUTH_INTENT_KEY);
  if (!raw) return { ...DASHBOARD_OVERVIEW };
  try {
    const o = JSON.parse(raw);
    if (o.source === 'pricing') {
      return { name: 'dashboard-billing' };
    }
    if (o.source === 'scan') {
      return { name: 'dashboard-scan' };
    }
  } catch (_) {}
  return { ...DASHBOARD_OVERVIEW };
}
