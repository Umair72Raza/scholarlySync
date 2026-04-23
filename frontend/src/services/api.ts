import axios from 'axios';

/**
 * Axios instance for all API calls.
 * - baseURL '/api' is proxied by Vite to http://localhost:3000 in dev.
 * - withCredentials: true ensures httpOnly cookies (accessToken, refreshToken)
 *   are attached to every request automatically — no manual token management.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // ← sends & receives cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor — silent token refresh on 401.
 *
 * Flow:
 *   1. Request hits a protected endpoint → access token cookie is expired
 *   2. Backend returns 401
 *   3. Interceptor catches it, calls POST /api/auth/refresh (refresh cookie sent automatically)
 *   4. Backend rotates both cookies and returns 200
 *   5. Interceptor retries the original request with the fresh cookie
 *
 * If refresh also fails (refresh cookie expired / revoked):
 *   → redirect to /signin so the user can log in again.
 *   The page reload lets initialize() in App.tsx detect the unauthenticated
 *   state cleanly, without any stale Zustand state.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard: don't attempt refresh if this IS the refresh request (avoid loops)
    const isRefreshUrl = originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshUrl) {
      originalRequest._retry = true;

      try {
        // No body needed — refreshToken cookie is sent automatically via withCredentials
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });

        // New accessToken cookie is now set by the backend — retry original request
        return api(originalRequest);
      } catch {
        // Refresh failed: session is fully dead — redirect to sign-in
        if (window.location.pathname !== '/signin') {
          window.location.href = '/signin';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
