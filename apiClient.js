import axios from "axios";
import { getStoredToken } from "./utils/authStorage";

// baseURL = root server URL only — NO /api suffix here.
// Every axios call in this app already includes /api/... in the path.
// Adding /api here would produce /api/api/... (double prefix = 503/404).
const PRODUCTION_SERVER = "https://misbackend-e078.onrender.com";

const LOCAL_SERVER  = import.meta.env.VITE_API_LOCAL  || "http://localhost:5000";
const REMOTE_SERVER = import.meta.env.VITE_API_SERVER || PRODUCTION_SERVER;

const hostname    = window.location.hostname;
const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

const currentBaseURL = isLocalhost ? LOCAL_SERVER : REMOTE_SERVER;

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
      REMOTE_SERVER &&
      originalConfig.baseURL !== REMOTE_SERVER &&
      !originalConfig.__retriedWithServer &&
      isNetworkFailure;

    if (canRetryRemote) {
      originalConfig.__retriedWithServer = true;
      originalConfig.baseURL = REMOTE_SERVER;
      return client(originalConfig);
    }

    return Promise.reject(error);
  }
);

export default client;
export const getApiBase = () => currentBaseURL;
