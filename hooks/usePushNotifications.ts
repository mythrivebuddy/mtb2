"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function usePushNotifications() {
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // First visit popup state
  const [showFirstVisitPopup, setShowFirstVisitPopup] = useState(false);

  const { status } = useSession();

  // Initial setup
  useEffect(() => {
    setIsLoading(true);

    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }

    // Show popup if first visit (after auth)
    const hasAsked = localStorage.getItem("notif_permission_asked");
    if (!hasAsked) {
      setShowFirstVisitPopup(true);
    }

    // Check push support
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsPushSupported(true);

      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          setSwRegistration(registration);
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

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key is missing");
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Force unsubscribe if already subscribed
      const existingSubscription = await swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("Unsubscribing existing push subscription...");
        await existingSubscription.unsubscribe();
      }

      // Create new subscription
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to backend
      await axios.post("/api/push/subscribe", {
        subscription,
        userAgent: navigator.userAgent,
      });

      // Optional: send test notification
      try {
        await axios.post("/api/push/test");
        toast.success("Push Notifications enabled");
      } catch (testError) {
        console.error("Test notification failed:", testError);
        toast.success("Push Notifications enabled (test failed to send)");
      }

      setIsSubscribed(true);
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

      const subscription = await swRegistration.pushManager.getSubscription();
      if (!subscription) {
        throw new Error("No subscription found");
      }

      await subscription.unsubscribe();

      await axios.post("/api/push/unsubscribe", {
        endpoint: subscription.endpoint,
      });

      setIsSubscribed(false);
      toast.success("Notifications disabled");
    } catch (err: any) {
      console.error("Failed to unsubscribe:", err);
      toast.error("Failed to disable notifications", {
        description: err.message || "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      setIsLoading(true);
      await axios.post("/api/push/test");
      toast.success("Test notification sent!");
    } catch (error) {
      console.error("Failed to send test notification:", error);
      toast.error("Failed to send test notification");
    } finally {
      setIsLoading(false);
    }
  };

  // Popup "Allow" action
  const handleFirstVisitAllow = async () => {
    localStorage.setItem("notif_permission_asked", "true");
    setShowFirstVisitPopup(false);
    await subscribe();
  };

  // Popup "Later" action
  const handleFirstVisitLater = () => {
    localStorage.setItem("notif_permission_asked", "true");
    setShowFirstVisitPopup(false);
  };

  return {
    isPushSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    showFirstVisitPopup,
    setShowFirstVisitPopup,
    handleFirstVisitAllow,
    handleFirstVisitLater,
  };
}

// Helper function to convert VAPID key
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
