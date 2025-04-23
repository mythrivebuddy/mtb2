/**
 * Hook for managing push notification subscriptions
 */
import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function usePushNotifications() {
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const { status } = useSession();

  // Check if push notifications are supported
  useEffect(() => {
    // Reset state on session change
    setIsLoading(true);

    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }

    // Check if service workers and push messaging are supported
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsPushSupported(true);

      // Register service worker
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          setSwRegistration(registration);

          // Check if already subscribed
          return registration.pushManager.getSubscription();
        })
        .then((subscription) => {
          setIsSubscribed(!!subscription);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
          setIsLoading(false);
          toast.error("Failed to set up notifications");
        });
    } else {
      setIsPushSupported(false);
      setIsLoading(false);
    }
  }, [status]);

  // Subscribe to push notifications
  const subscribe = async () => {
    try {
      setIsLoading(true);

      if (!swRegistration) {
        throw new Error("Service worker not registered");
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        throw new Error("Push notification configuration is missing");
      }

      // Convert base64 VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true, // Always show notifications to user
        applicationServerKey,
      });

      // Send subscription to server
      await axios.post("/api/push/subscribe", {
        subscription,
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      toast.success("Notifications enabled", {
        description: "You will now receive push notifications",
      });
    } catch (err: any) {
      console.error("Failed to subscribe to push notifications:", err);
      toast.error("Failed to enable notifications", {
        description: err.message || "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    try {
      setIsLoading(true);

      if (!swRegistration) {
        throw new Error("Service worker not registered");
      }

      // Get current subscription
      const subscription = await swRegistration.pushManager.getSubscription();

      if (!subscription) {
        throw new Error("No subscription found");
      }

      // Unsubscribe
      await subscription.unsubscribe();

      // Notify server
      await axios.post("/api/push/unsubscribe", {
        endpoint: subscription.endpoint,
      });

      setIsSubscribed(false);
      toast.success("Notifications disabled");
    } catch (err: any) {
      console.error("Failed to unsubscribe from push notifications:", err);
      toast.error("Failed to disable notifications", {
        description: err.message || "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isPushSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}

/**
 * Convert base64 string to Uint8Array for use with the Web Push API
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
