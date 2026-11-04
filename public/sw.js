// Recebe os avisos mesmo com o app fechado
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let dados = {}
  try {
    dados = event.data ? event.data.json() : {}
  } catch {
    dados = { title: 'Escala Igreja Viver', body: event.data?.text() }
  }
  event.waitUntil(
    self.registration.showNotification(dados.title || 'Escala Igreja Viver', {
      body: dados.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: dados.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) {
        if ('focus' in c) {
          c.navigate(url)
          return c.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
