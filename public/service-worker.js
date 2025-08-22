// File: public/service-worker.js

/**
 * This event listener is triggered whenever a push notification is received from the server.
 */
self.addEventListener("push", function (event) {
  let data = {};
  try {
    // Attempt to parse the data from the push event as JSON.
    // This is where the title, body, and icon come from.
    data = event.data.json();
  } catch (e) {
    console.error("Push event data is not valid JSON.", e);
    // If parsing fails, we'll use a default notification.
    data = {
      title: "New Notification",
      body: "You have a new update from MyThriveBuddy.",
      icon: "/icon-192x192.png",
      data: {
        url: "/dashboard/notifications"
      }
    };
  }

  // These are the options for the notification pop-up.
  const options = {
    body: data.body,
    icon: data.icon || "/icon-192x192.png", // A default icon for your app
    badge: "/icon-96x96.png", // Icon for the notification tray on Android
    vibrate: [200, 100, 200], // Vibration pattern for mobile devices
    // The 'data' object can hold any custom data. We use it to store the URL to open on click.
    data: {
      url: data.url || "/dashboard/notifications",
    },
  };

  // This is the command that tells the browser to actually show the notification.
  // We wrap it in event.waitUntil to ensure the service worker stays active until the notification is displayed.
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * This event listener is triggered when a user clicks on a notification.
 */
self.addEventListener("notificationclick", function (event) {
  // Close the notification pop-up.
  event.notification.close();

  // Get the URL to open from the notification's data object.
  const urlToOpen = event.notification.data.url;

  // This command tells the browser to find an open tab with the same URL and focus it.
  // If no such tab exists, it opens a new one.
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
