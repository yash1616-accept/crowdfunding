/**
 * Returns the correct API base URL.
 * - In local dev, returns '' so Vite's proxy (/api → localhost:3000) takes over.
 * - In production (Vercel), returns the deployed backend URL set in VITE_API_BASE_URL.
 * Trailing slashes are stripped to prevent double-slash URLs.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Convenience wrapper: builds a full API path.
 * Usage: apiUrl('/api/campaigns') → '/api/campaigns' (local) or 'https://your-backend.vercel.app/api/campaigns' (prod)
 */
export const apiUrl = (path: string) => `${API_BASE}${path}`;
