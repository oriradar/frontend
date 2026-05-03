const KEY = 'oriradar.pendingScanDomain';

/**
 * Validated domain/URL to scan, persisted between home and dashboard (sessionStorage).
 */
export function setPendingScanDomain(url) {
  try {
    if (url && typeof url === 'string') {
      sessionStorage.setItem(KEY, url.trim());
    }
  } catch (_) {}
}

export function getPendingScanDomain() {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch (_) {
    return '';
  }
}

export function clearPendingScanDomain() {
  try {
    sessionStorage.removeItem(KEY);
  } catch (_) {}
}
