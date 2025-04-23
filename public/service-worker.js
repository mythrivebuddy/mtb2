// Service worker for handling push notifications

self.addEventListener("push", function (event) {
  // Parse the incoming data from the push message
  const data = event.data.json();

  // Extract notification details
  const { title, ...options } = data.notification;

  // Show the notification to the user
  const promiseChain = self.registration.showNotification(title, options);
  event.waitUntil(promiseChain);
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  // Close the notification when clicked
  event.notification.close();

  // Get the URL to open (if provided)
  const url = event.notification.data?.url || "/dashboard/notifications";

  // Open the URL in a browser tab when notification is clicked
  event.waitUntil(clients.openWindow(url));
});
