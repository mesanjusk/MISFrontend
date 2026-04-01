import axios from "axios";
import { getStoredToken } from "./utils/authStorage";

const LOCAL_API = import.meta.env.VITE_API_LOCAL;
const SERVER_API = import.meta.env.VITE_API_SERVER;

let currentBaseURL = LOCAL_API;

// create instance
const client = axios.create({
  baseURL: currentBaseURL,
});

// 🔁 dynamic fallback logic
client.interceptors.request.use(async (config) => {
  const token = getStoredToken();

  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

// 🔥 fallback on error
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // if local fails → switch to server
    if (
      error.config &&
      currentBaseURL === LOCAL_API &&
      !error.config._retry
    ) {
      console.warn("⚠️ Local backend failed → switching to server");

      error.config._retry = true;
      currentBaseURL = SERVER_API;

      // update baseURL dynamically
      client.defaults.baseURL = SERVER_API;
      error.config.baseURL = SERVER_API;

      return client(error.config);
    }

    return Promise.reject(error);
  }
);

export default client;
export const getApiBase = () => currentBaseURL;