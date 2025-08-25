// src/utils/api.js
import axios from "axios";

/**
 * Decide the best base URL:
 * 1) If we're on localhost, prefer same-origin (no base).
 * 2) Otherwise try Vite/CRA envs (VITE_API_BASE / REACT_APP_API).
 * 3) Finally fall back to your Render URL.
 */
export const API_BASE = (() => {
  const isLocalHost =
    typeof window !== "undefined" &&
    /^localhost(:\d+)?$/.test(window.location.host);

  if (isLocalHost) return ""; // same-origin during local dev via proxy/Vite

  const fromEnv =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
    process.env?.REACT_APP_API ||
    "";

  if (fromEnv) return String(fromEnv).replace(/\/$/, "");

  // FINAL fallback (your deployed backend)
  return "https://misbackend-e078.onrender.com";
})();

/**
 * Try a list of paths or absolute URLs until one works.
 * - Each entry in `urls` can be relative ("/api/...") or absolute ("https://...").
 * - We’ll also try the same path prefixed with API_BASE when needed.
 */
export async function getWithFallback(urls, config = {}) {
  const attempts = [];

  for (const u of urls) {
    const isAbsolute = /^https?:\/\//i.test(u);
    if (isAbsolute) {
      attempts.push(u);
    } else {
      // try relative as-is (same origin)
      attempts.push(u);
      // and try with API_BASE prefix if not already absolute and API_BASE exists
      if (API_BASE) attempts.push(`${API_BASE}${u}`);
    }
  }

  const seen = new Set();
  for (const url of attempts) {
    if (seen.has(url)) continue; // dedupe
    seen.add(url);
    try {
      const res = await axios.get(url, config);
      // Basic sanity: 2xx with some data
      if (res && res.status >= 200 && res.status < 300) {
        // console.debug("[getWithFallback] OK:", url, res.data);
        return res;
      }
    } catch (e) {
      // console.warn("[getWithFallback] failed:", url, e?.response?.status, e?.message);
    }
  }
  throw new Error("All endpoints failed: " + attempts.join(" | "));
}

/**
 * Similar helper for POST if you need it later.
 */
export async function postWithFallback(urls, body, config = {}) {
  const attempts = [];

  for (const u of urls) {
    const isAbsolute = /^https?:\/\//i.test(u);
    if (isAbsolute) {
      attempts.push(u);
    } else {
      attempts.push(u);
      if (API_BASE) attempts.push(`${API_BASE}${u}`);
    }
  }

  const seen = new Set();
  for (const url of attempts) {
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const res = await axios.post(url, body, config);
      if (res && res.status >= 200 && res.status < 300) {
        return res;
      }
    } catch (e) {
      // swallow and try next
    }
  }
  throw new Error("All POST endpoints failed: " + attempts.join(" | "));
}
