import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:7000';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  // Repeat array params as `roles=Member&roles=Admin`. Axios defaults to `roles[]=...`,
  // which ASP.NET does not bind to a string[] — it silently sees no value at all, so a
  // filtered request quietly comes back unfiltered rather than failing.
  paramsSerializer: { indexes: null },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Endpoints that answer questions about credentials rather than use a session. A 401 from
 * one of these is the answer — wrong password, spent invite — and the page that asked has
 * its own message to show for it.
 */
const PRE_AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/signup-info'];

/**
 * How the app is told a session has ended. AuthProvider registers itself here so the React
 * tree can drop the signed-in user and the cached group data it was showing; without a
 * handler there is nothing to clear state, so a full page load is the only way out.
 */
let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? '';
    const answersCredentials = PRE_AUTH_PATHS.some(path => url.startsWith(path));

    // Sign out when a session goes bad mid-use — an expired token, a login disabled while
    // someone was working — but never on the way in: a failed sign-in would remount the form
    // and wipe the "wrong email or password" the page had just set, leaving it silently blank.
    if (err.response?.status === 401 && !answersCredentials) {
      localStorage.removeItem('hs_token');
      if (sessionExpiredHandler) {
        sessionExpiredHandler();
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
