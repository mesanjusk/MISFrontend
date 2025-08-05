/* global __APP_VERSION__ */

export function initVersionChecker(interval = 5 * 60 * 1000) {
  const check = async () => {
    try {
      const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-cache' });
      const data = await res.json();
      if (data.version && data.version !== __APP_VERSION__) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to check app version', err);
    }
  };

  check();
  setInterval(check, interval);
}
