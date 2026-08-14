// Runtime configuration
// API requests default to same-origin `/api` (proxied to the backend in dev,
// served behind the same host/TLS termination in production). Override with
// VITE_API_BASE_URL when the backend lives on another origin.

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const BACKEND_ORIGIN = rawBaseUrl.replace(/\/+$/, '');

export const API_BASE_URL = `${BACKEND_ORIGIN}/api`;

// Build a URL for a backend-served static file (profile pictures, attachments).
// Only relative paths returned by the API are accepted so a tampered response
// cannot turn an <img>/<iframe> source into an absolute or `javascript:` URL.
export const assetUrl = (path) => {
  if (typeof path !== 'string' || path === '') return null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return `${BACKEND_ORIGIN}${path}`;
};
