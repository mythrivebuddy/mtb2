// // Service worker for handling push notifications

// self.addEventListener("push", function (event) {
//   // Parse the incoming data from the push message
//   const data = event.data.json();

//   // Extract notification details
//   const { title, ...options } = data.notification;
//   console.log(
//     "here in the worker setup",
//     "data.notificaiton",
//     data.notification
//   ); //?dev

//   // Show the notification to the user
//   const promiseChain = self.registration.showNotification(title, options);
//   event.waitUntil(promiseChain);
// });

// // Handle notification click
// self.addEventListener("notificationclick", function (event) {
//   // Close the notification when clicked
//   event.notification.close();

//   // Get the URL to open (if provided)
//   const url = event.notification.data?.url || "/dashboard/notifications";

//   // Open the URL in a browser tab when notification is clicked
//   event.waitUntil(clients.openWindow(url));
// });




// Service worker for handling push notifications

// self.addEventListener("push", function (event) {
//   // Parse the incoming data from the push message
//   const data = event.data.json();
//   console.log("[SW] Received push event!", event);
//   // Extract notification details
//   const { title, ...options } = data.notification;

//   // Enhanced options for promoting banner-style display
//   const enhancedOptions = {
//     ...options,
//     requireInteraction: false,  // Don't require user interaction to dismiss
//     silent: false,              // Play sound when notification appears
//     vibrate: [200, 100, 200],   // Vibration pattern for mobile devices
//     timestamp: Date.now(),      // Current timestamp for urgency
//     priority: 'high',           // High priority for better visibility
//     tag: options.tag || 'important',  // Keep existing tag or set default
//     // Preserve existing data or create default
//     data: {
//       ...(options.data || {}),
//       url: options.data?.url || "/dashboard/notifications"
//     }
//   };

//   console.log(
//     "here in the worker setup",
//     "data.notification with enhanced options",
//     { title, ...enhancedOptions }
//   ); //?dev

//   // Show the notification to the user with enhanced options
//   const promiseChain = self.registration.showNotification(title, enhancedOptions);
//   event.waitUntil(promiseChain);
// });

// // Handle notification click
// self.addEventListener("notificationclick", function (event) {
//   // Close the notification when clicked
//   event.notification.close();

//   // Get the URL to open (if provided)
//   const url = event.notification.data?.url || "/dashboard/notifications";

//   // Open the URL in a browser tab when notification is clicked
//   event.waitUntil(clients.openWindow(url));
// });
// my


// push Notification
self.addEventListener("push", function (event) {
  let data = null;
  let title = "Notification";
  let body = "You have a new notification";
  let options = {};

  try {
    // Try to parse the push payload
    if (event.data) {
      data = event.data.json();

      // Extract notification details properly
      if (data && data.notification) {
        title = data.notification.title || "Notification";
        body = data.notification.body || "You have a new notification";

        // Enhanced options for better notification display
        options = {
          body: body,
          icon: data.notification.icon || "/logo.png",
          badge: "/logo.png",
          requireInteraction: true,
          silent: false,
          vibrate: [200, 100, 200],
          timestamp: Date.now(),
          tag: data.notification.tag || `push-${Date.now()}`,
          data: {
            url: data.notification.data?.url || "/dashboard/notifications",
            ...data.notification.data
          }
        };
      }
    }
  } catch (e) {
    console.error("[SW] Failed to parse push data as JSON", e); // Use console.error, not log
    // Fallback values
    title = "Notification";
    body = "You have a new notification";
    options = {
      body: body,
      icon: "/logo.png",
      data: { url: "/dashboard/notifications" }
    };
  }

  console.log("[SW] Showing notification:", title, options); // Use console.log, not log

  // Show the notification
  const promiseChain = self.registration.showNotification(title, options);
  event.waitUntil(promiseChain);
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  console.log("[SW] Notification clicked"); // Use console.log, not log

  // Close the notification
  event.notification.close();

  // Get the URL to open
  const url = event.notification.data?.url || "/dashboard/notifications";

  // Open the URL in a browser tab
  event.waitUntil(clients.openWindow(url));
});
