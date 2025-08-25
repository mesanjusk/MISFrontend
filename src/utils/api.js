import axios from '../apiClient.js';

// Try a list of endpoints until one succeeds. Skips 404s.
export async function getWithFallback(paths, config) {
  let lastErr;
  for (const url of paths) {
    try {
      return await axios.get(url, config);
    } catch (err) {
      if (err?.response?.status === 404) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error('All fallbacks failed');
}
