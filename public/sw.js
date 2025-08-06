// Service worker for handling push notifications

self.addEventListener("push", function (event) {
  console.log("[SW] Push event received:", event);
  
  let title = "Notification";
  let body = "You have a new notification";
  let options = {};

  try {
    if (event.data) {
      const data = event.data.json();
      console.log("[SW] Parsed push data:", data);
      
      if (data && data.notification) {
        // Extract the actual title and body from the notification object
        title = data.notification.title || "Notification";
        body = data.notification.body || "You have a new notification";
        
        // Set up notification options
        options = {
          body: body, // This is the clean message text
          icon: data.notification.icon || "/logo.png",
          badge: "/logo.png",
          requireInteraction: true,
          silent: false,
          vibrate: [200, 100, 200],
          timestamp: Date.now(),
          tag: 'push-notification',
          data: {
            url: data.notification.data?.url || "/dashboard/notifications"
          }
        };
      }
    }
  } catch (error) {
    console.error("[SW] Error parsing push data:", error);
    // Use fallback values
    options = {
      body: body,
      icon: "/logo.png",
      data: { url: "/dashboard/notifications" }
    };
  }

  console.log("[SW] Displaying notification - Title:", title, "Options:", options);

  // Show the notification with clean title and body
  const promiseChain = self.registration.showNotification(title, options);
  event.waitUntil(promiseChain);
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  console.log("[SW] Notification clicked");
  event.notification.close();
  
  const url = event.notification.data?.url || "/dashboard/notifications";
  event.waitUntil(clients.openWindow(url));
});
