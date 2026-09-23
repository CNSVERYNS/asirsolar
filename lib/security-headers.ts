export function contentSecurityPolicy({ development = false, nonce, marketing = false }: { development?: boolean; nonce?: string; marketing?: boolean } = {}) {
  if (nonce && !/^[A-Za-z0-9+/=_-]+$/.test(nonce)) throw new Error("Invalid CSP nonce");
  const trackingScripts = marketing ? " https://www.googletagmanager.com https://connect.facebook.net" : "";
  return [
    "default-src 'self'",
    `script-src 'self' ${nonce ? `'nonce-${nonce}' 'strict-dynamic'` : "'unsafe-inline'"}${development ? " 'unsafe-eval'" : ""}${trackingScripts}`,
    "style-src 'self' 'unsafe-inline'", "font-src 'self'", "media-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    `img-src 'self' data: blob:${marketing ? " https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com" : ""}`,
    `connect-src 'self'${development ? " ws: wss:" : ""}${marketing ? " https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://www.facebook.com" : ""}`,
    `frame-src https://www.google.com${marketing ? " https://www.googletagmanager.com https://www.facebook.com" : ""}`,
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
