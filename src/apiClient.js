import axios from 'axios';

const LOCAL_BASE = 'http://localhost:10000';
const PROD_BASE = 'https://misbackend-e078.onrender.com';

const stripTrailingSlash = (value = '') => value.replace(/\/$/, '');

const envBase =
  (typeof import.meta !== 'undefined' && (import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API)) ||
  (typeof process !== 'undefined' && (process.env.VITE_API_BASE || process.env.REACT_APP_API)) ||
  undefined;

let API_BASE = stripTrailingSlash(envBase || PROD_BASE);

const client = axios.create({ baseURL: API_BASE });

async function chooseBase() {
  if (envBase) return envBase;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`${LOCAL_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    API_BASE = stripTrailingSlash(res.ok ? LOCAL_BASE : PROD_BASE);
  } catch {
    API_BASE = stripTrailingSlash(PROD_BASE);
  }
  client.defaults.baseURL = API_BASE;
  return API_BASE;
}

export const apiBasePromise = chooseBase();
export const getApiBase = () => API_BASE;

const tokenKeys = ['token', 'authToken', 'access_token', 'ACCESS_TOKEN'];
const getToken = () => tokenKeys.map((k) => localStorage.getItem(k)).find(Boolean);

client.interceptors.request.use((config) => {
  const baseURL = stripTrailingSlash(
    config.baseURL || client.defaults.baseURL || API_BASE || ''
  );
  if (config.url && !/^https?:\/\//i.test(config.url)) {
    let url = config.url.startsWith('/') ? config.url : `/${config.url}`;
    config.url = url;
    config.baseURL = baseURL;
  }

  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // Optionally notify user
    }
    return Promise.reject(err);
  },
);

export default client;
