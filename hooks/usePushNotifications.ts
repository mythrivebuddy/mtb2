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

  useEffect(() => {

    setIsLoading(true);

    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }

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

//   useEffect(() => {
//   setIsLoading(true);

//   if (status !== "authenticated") {
//     setIsLoading(false);
//     return;
//   }

//   if ("serviceWorker" in navigator && "PushManager" in window) {
//     setIsPushSupported(true);

//     navigator.serviceWorker
//       .register("/service-worker.js")
//       .then(async (registration) => {
//         setSwRegistration(registration);
//         const subscription = await registration.pushManager.getSubscription();
//         setIsSubscribed(!!subscription);
//         setIsLoading(false);

//         // 🚀 Auto prompt for permission only once
//         const prompted = localStorage.getItem("pushPrompted");
//         if (!subscription && prompted !== "true") {
//           const permission = await Notification.requestPermission();
//           localStorage.setItem("pushPrompted", "true");

//           if (permission === "granted") {
//             // Auto-subscribe
//             await subscribe();
//           }
//         }
//       })
//       .catch((err) => {
//         console.error("Service Worker registration failed:", err);
//         setIsLoading(false);
//         toast.error("Failed to set up notifications");
//       });
//   } else {
//     setIsPushSupported(false);
//     setIsLoading(false);
//   }
// }, [status]);


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

      // ✅ Force unsubscribe from any existing subscription
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

      // Send to backend
      await axios.post("/api/push/subscribe", {
        subscription,
        userAgent: navigator.userAgent,
      });

      // Optionally send test notification
      try {
        await axios.post("/api/push/test");
        toast.success("Push Notifications enabled and test sent!");
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

  return {
    isPushSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

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
