import { useState, useEffect, useCallback } from 'react';
import { notificationClient } from '../api/grpc/notificationClient';
import { SubscribeRequest, PushSubscription, SubscribeResponse } from '../api/gen/notification';

// VAPID key from environment variables
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Helper function to convert the VAPID key
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * A custom hook to manage web push notification subscriptions.
 * @param userId - The ID of the user to associate with the subscription.
 * @returns An object with subscription status, loading state, and control functions.
 */
export const usePushNotifications = (userId: string | number | undefined) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
    } else {
      setStatusMessage("Push notifications are not supported by this browser.");
      setIsLoading(false);
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        setIsSubscribed(true);
        setStatusMessage("This device is subscribed to push notifications.");
      } else {
        setIsSubscribed(false);
        setStatusMessage("Enable push notifications on this device.");
      }
    } catch (error) {
      console.error("Error checking push subscription:", error);
      setStatusMessage("Could not check notification status.");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async () => {
    if (!userId) {
      setStatusMessage("You must be logged in to subscribe.");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setStatusMessage("VAPID key is not configured.");
      return;
    }

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJSON = subscription.toJSON();
      if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
        throw new Error("Failed to get complete subscription details.");
      }
      
      const grpcSubscription: PushSubscription = {
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth,
      }
      
      const subscribeReq: SubscribeRequest = {
        userId: String(userId),
        subscription: grpcSubscription,
      }

      const subscribeRes: SubscribeResponse = await notificationClient.Subscribe(subscribeReq);

      if (subscribeRes.success) {
        setStatusMessage("Successfully subscribed this device!");
        setIsSubscribed(true);
      } else {
        throw new Error(subscribeRes.message || "Server failed to subscribe.");
      }
    } catch (error) {
      console.error("Subscription failed:", error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : "An unknown error occurred."}`);
      setIsSubscribed(false); // Revert state on failure
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const success = await subscription.unsubscribe();
        if (success) {
          setStatusMessage("Successfully unsubscribed this device.");
          setIsSubscribed(false);
          // Optional: You can add a backend call here to delete the subscription from your database.
        } else {
          throw new Error("Browser failed to unsubscribe.");
        }
      }
    } catch (error) {
      console.error("Unsubscription failed:", error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : "An unknown error occurred."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscriptionChange = async (shouldBeSubscribed: boolean) => {
    if (isLoading || !isSupported) return;

    if (shouldBeSubscribed) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  return {
    isPushSubscribed: isSubscribed,
    isPushLoading: isLoading,
    handlePushSubscriptionChange: handleSubscriptionChange,
    pushStatusMessage: statusMessage,
  };
};
