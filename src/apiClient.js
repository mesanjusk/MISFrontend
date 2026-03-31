import axios from "axios";

const LOCAL_BASE = "http://localhost:10000";
const PROD_BASE = "https://misbackend-e078.onrender.com";

const envBase =
  (typeof import.meta !== "undefined" && import.meta.env.VITE_API_BASE) ||
  undefined;

let API_BASE = envBase || PROD_BASE;

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Auto choose base (optional but fine)
async function chooseBase() {
  if (envBase) return envBase;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    const res = await fetch(`${LOCAL_BASE}/`, { signal: controller.signal });
    clearTimeout(timeout);

    API_BASE = res.ok ? LOCAL_BASE : PROD_BASE;
  } catch {
    API_BASE = PROD_BASE;
  }

  client.defaults.baseURL = API_BASE;
  return API_BASE;
}

chooseBase();

const tokenKeys = ["token", "authToken", "access_token", "ACCESS_TOKEN"];

const getToken = () =>
  tokenKeys.map((k) => localStorage.getItem(k)).find(Boolean);

client.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default client;
export const getApiBase = () => API_BASE;