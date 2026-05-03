function isValidDomainHostname(host) {
  if (!host || host.length > 253) return false;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) return false;
  if (host.indexOf(':') !== -1) return false;
  const labels = host.split('.');
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1];
  if (tld.length < 2) return false;
  for (let i = 0; i < labels.length; i++) {
    const lab = labels[i];
    if (!lab.length || lab.length > 63) return false;
    if (lab.slice(0, 4).toLowerCase() === 'xn--') {
      if (!/^xn--[a-z0-9-]+$/i.test(lab)) return false;
      continue;
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(lab)) return false;
  }
  return true;
}

export function validateStrictDomainUrl(raw) {
  const s = raw.trim();
  if (!s) {
    return { ok: false, message: 'Enter a URL starting with http:// or https://.' };
  }
  if (!/^https?:\/\//i.test(s)) {
    return { ok: false, message: 'The URL must start with http:// or https://.' };
  }
  let u;
  try {
    u = new URL(s);
  } catch {
    return { ok: false, message: 'Invalid URL.' };
  }
  const proto = u.protocol.toLowerCase();
  if (proto !== 'http:' && proto !== 'https:') {
    return { ok: false, message: 'Only http:// and https:// are allowed.' };
  }
  if (u.username || u.password) {
    return { ok: false, message: 'Remove user:password@ from the URL.' };
  }
  if (u.port) {
    return { ok: false, message: 'Do not include a port number.' };
  }
  const path = u.pathname;
  if (path !== '/' && path !== '') {
    return { ok: false, message: 'No path after the domain - only https://name.tld' };
  }
  if (u.search || u.hash) {
    return { ok: false, message: 'No ?query or #fragment allowed.' };
  }
  const host = u.hostname;
  if (!isValidDomainHostname(host)) {
    return {
      ok: false,
      message: 'Enter a valid domain with a TLD (e.g. example.com), not an IP address.'
    };
  }
  return { ok: true };
}
