const CACHE_NAME = 'familia-guerrero-v1'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = e.request.url
  if (!url.startsWith('http')) return
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((response) => {
        if (response.ok && url.startsWith(self.location.origin)) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone).catch(() => {}))
        }
        return response
      }).catch(() => cached)
      return cached || fetched
    })
  )
})
