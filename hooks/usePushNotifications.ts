"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function usePushNotifications() {
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  const [showFirstVisitPopup, setShowFirstVisitPopup] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      if (status !== "authenticated") {
        setIsLoading(false);
        return;
      }

      const hasAsked = localStorage.getItem("notif_permission_asked");
      if (!hasAsked) setShowFirstVisitPopup(true);

      const supported = "serviceWorker" in navigator && "PushManager" in window && window.isSecureContext;
      setIsPushSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      try {
        // Ensure the SW file is in /public/service-worker.js
        await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
        // Wait until it's ACTIVE (fixes mobile/PWA race)
        const readyReg = await navigator.serviceWorker.ready;
        swRegRef.current = readyReg;

        const sub = await readyReg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch (e) {
        console.error("Service Worker setup failed:", e);
        toast.error("Failed to set up notifications");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [status]);

  const subscribe = async () => {
    try {
      setIsLoading(true);

      const reg = swRegRef.current || (await navigator.serviceWorker.ready);
      if (!reg) throw new Error("Service worker not ready");

      // Must be from a user gesture
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error(`Notification permission not granted (state: ${permission})`);
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error("VAPID public key is missing");

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Create subscription if none
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:applicationServerKey as BufferSource
        });
      }

      await axios.post("/api/push/subscribe", {
        subscription,
        userAgent: navigator.userAgent
      });

      try {
        await axios.post("/api/push/test");
        toast.success("Push notifications enabled");
      } catch (testError) {
        console.warn("Test notification failed:", testError);
        toast.success("Push enabled (test send failed)");
      }

      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Subscribe error:", err);
      toast.error("Failed to enable notifications", {
        description: err?.message || "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      setIsLoading(true);
      const reg = swRegRef.current || (await navigator.serviceWorker.ready);
      if (!reg) throw new Error("Service worker not ready");

      const subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      await axios.post("/api/push/unsubscribe", { endpoint: subscription.endpoint }).catch(() => {});
      await subscription.unsubscribe();

      setIsSubscribed(false);
      toast.success("Notifications disabled");
    } catch (err: any) {
      console.error("Unsubscribe error:", err);
      toast.error("Failed to disable notifications", {
        description: err?.message || "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleFirstVisitAllow = async () => {
    localStorage.setItem("notif_permission_asked", "true");
    setShowFirstVisitPopup(false);
    await subscribe(); // user gesture context
  };

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
    handleFirstVisitLater
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
