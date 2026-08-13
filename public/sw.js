self.addEventListener("push", event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? "순모아 새 공지", {
      body: data.body ?? "",
      data: { url: data.url },
      icon: "/icon-192.png",
    }),
  )
})

self.addEventListener("notificationclick", event => {
  event.notification.close()
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
