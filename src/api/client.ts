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

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? '';
    const answersCredentials = PRE_AUTH_PATHS.some(path => url.startsWith(path));

    // Bounce to the login screen when a session goes bad mid-use, but never on the way in:
    // this is a full page load, so doing it for a failed sign-in remounts the form and wipes
    // the "wrong email or password" the page had just set, leaving it silently blank.
    if (err.response?.status === 401 && !answersCredentials) {
      localStorage.removeItem('hs_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
