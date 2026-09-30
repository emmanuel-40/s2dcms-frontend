// Centralized configuration for API URLs and environment variables
// In development, use Vite proxy (/api -> localhost:8080) for same-origin cookie handling
// In production, use full URL from env var
const BACKEND_ORIGIN = import.meta.env.VITE_API_BASE_URL || '';
const ASSET_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_BASE_URL = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : '/api';

export const assetUrl = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
    ? `${ASSET_ORIGIN}${path}` : null;
