import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://misbackend-e078.onrender.com";

const client = axios.create({
  baseURL: API_BASE,
});

const tokenKeys = ["token", "authToken", "access_token", "ACCESS_TOKEN"];

const getToken = () =>
  tokenKeys.map((key) => localStorage.getItem(key)).find(Boolean);

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default client;
export const getApiBase = () => API_BASE;