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

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hs_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
