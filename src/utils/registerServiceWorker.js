export default async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered', registration);

    if ('PushManager' in window) {
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          if (key) {
            const convertedKey = urlBase64ToUint8Array(key);
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey,
            });
            console.log('Push subscription', JSON.stringify(subscription));
          }
        }
      }
    }
  } catch (err) {
    console.error('Service worker registration failed', err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
