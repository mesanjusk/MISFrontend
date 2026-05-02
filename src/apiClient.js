import axios from "axios";
import { getStoredToken } from "./utils/authStorage";

// Hardcoded fallback ensures production always has a baseURL even if
// VITE_API_SERVER is not baked in at Vercel build time.
const PRODUCTION_SERVER = "https://misbackend-e078.onrender.com";

const LOCAL_API  = import.meta.env.VITE_API_LOCAL  || "http://localhost:5000";
const SERVER_API = import.meta.env.VITE_API_SERVER || PRODUCTION_SERVER;

const hostname    = window.location.hostname;
const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

const currentBaseURL = isLocalhost ? LOCAL_API : SERVER_API;

const client = axios.create({
  baseURL: currentBaseURL,
});

client.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error?.config || {};
    const isNetworkFailure = !error?.response;
    const canRetryRemote =
      isLocalhost &&
      SERVER_API &&
      originalConfig.baseURL !== SERVER_API &&
      !originalConfig.__retriedWithServer &&
      isNetworkFailure;

    if (canRetryRemote) {
      originalConfig.__retriedWithServer = true;
      originalConfig.baseURL = SERVER_API;
      return client(originalConfig);
    }

    return Promise.reject(error);
  }
);

export default client;
export const getApiBase = () => currentBaseURL;
