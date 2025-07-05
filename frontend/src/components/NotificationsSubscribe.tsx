// src/components/NotificationsSubscribe.tsx
import { useState, useEffect } from 'react';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const NotificationsSubscribe = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const VAPID_PUBLIC_KEY = "YOUR_VAPID_PUBLIC_KEY"; // Replace with your key

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(subscription => {
          if (subscription) {
            setIsSubscribed(true);
          }
        });
      });
    }
  }, []);

  const subscribeUser = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send the subscription object to your backend
      await fetch('/api/subscribe', { // Your Go backend endpoint
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setIsSubscribed(true);
    }
  };

  return (
    <button onClick={subscribeUser} disabled={isSubscribed}>
      {isSubscribed ? 'Subscribed to Notifications' : 'Subscribe to Notifications'}
    </button>
  );
};

export default NotificationsSubscribe;