/* eslint-disable no-undef */
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "HabitIQ Reminder";
  const options = {
    body: data.body || "You have pending habits!",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    actions: data.actions || [],
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: {
      url: data.url || "/dashboard",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  
  if (action === "snooze") {
    // Just close the notification (we already did above)
    // Could optionally trigger an API call to postpone reminder
    return;
  }

  // Handle default click or "open_app" action
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
