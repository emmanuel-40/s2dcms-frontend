// Centralized configuration for API URLs and environment variables
// In development, use Vite proxy (/api -> localhost:8080) for same-origin cookie handling
// In production, use full URL from env var
const BACKEND_ORIGIN = import.meta.env.VITE_API_BASE_URL || '';
const ASSET_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_BASE_URL = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : '/api';

/**
 * Resolve a stored file path into a URL the browser can load.
 *
 * Two shapes are supported, because the backend can store either one:
 *  - "/uploads/profile/<uuid>_pic.png" -> served by this backend, so prefix the origin.
 *  - "https://<project>.supabase.co/storage/v1/object/public/..." -> an absolute URL from
 *    Supabase Storage, already fetchable, and must be passed through untouched. Rejecting it
 *    would render every stored image as broken once uploads move off local disk.
 *
 * Anything else is rejected - notably protocol-relative "//host/x", which would resolve
 * against the current page's scheme and is not a stored-asset shape this app produces.
 */
export const assetUrl = (path) => {
  if (typeof path !== 'string' || path === '') return null;
  if (path.startsWith('//')) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? `${ASSET_ORIGIN}${path}` : null;
};
