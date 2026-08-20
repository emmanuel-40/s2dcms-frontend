// Centralized configuration for API URLs and environment variables
const BACKEND_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_BASE_URL = `${BACKEND_ORIGIN}/api`;

export const assetUrl = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
    ? `${BACKEND_ORIGIN}${path}` : null;
