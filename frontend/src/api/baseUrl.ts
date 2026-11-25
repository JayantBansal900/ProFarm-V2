/**
 * Where the browser should send API requests.
 *
 * - An explicit VITE_API_BASE_URL always wins (an empty string means "same address").
 * - A production build is normally served by the API itself, so it calls the same address.
 * - Local development talks to the backend on port 4000.
 */
export function resolveApiBaseUrl(configured: string | undefined, isProductionBuild: boolean): string {
  if (configured !== undefined) return configured.replace(/\/+$/, '');
  return isProductionBuild ? '' : 'http://localhost:4000';
}
