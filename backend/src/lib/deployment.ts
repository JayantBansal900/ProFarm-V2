/**
 * Settings that depend on where the server runs. Kept as small pure functions so the
 * rules are easy to test without touching process.env.
 */

const LOCAL_FRONTEND = 'http://localhost:5173';

/**
 * The one origin allowed by CORS and the CSRF check. An explicit FRONTEND_ORIGIN wins;
 * on Render the platform provides the service's own address as RENDER_EXTERNAL_URL, so a
 * single-service deploy needs no manual setting.
 */
export function resolveFrontendOrigin(explicit: string | undefined, renderExternalUrl: string | undefined): string {
  const chosen = explicit?.trim() || renderExternalUrl?.trim() || LOCAL_FRONTEND;
  return chosen.replace(/\/+$/, '');
}

/**
 * How many reverse-proxy hops to trust when working out a visitor's IP address.
 * Hosting platforms put one proxy in front of the app: without trusting it, every visitor
 * shares the proxy's IP and therefore one rate-limit bucket.
 */
export function resolveTrustProxy(explicit: number | undefined, nodeEnv: string): number {
  return explicit ?? (nodeEnv === 'production' ? 1 : 0);
}
