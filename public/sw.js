// Service Worker — Discipline App
const CACHE = 'discipline-v1'
const STATIC = [
  '/',
  '/tasks',
  '/history',
  '/stats',
  '/settings',
  '/manifest.webmanifest',
]

// ── Install: cache app shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC).catch(() => {}))
  )
})

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: network-first, fallback to cache ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Skip cross-origin and API requests
  if (!event.request.url.startsWith(self.location.origin)) return
  if (event.request.url.includes('/api/')) return
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, clone))
        return res
      })
      .catch(() => caches.match(event.request))
  )
})

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Disciplina', body: event.data.text() }
  }

  const options = {
    body: payload.body,
    icon: payload.icon ?? '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: payload.data?.habitId ?? 'discipline',
    data: payload.data ?? {},
    requireInteraction: true,
    actions: [
      { action: 'open', title: '→ Abrir tarea' },
      { action: 'dismiss', title: 'Ahora no' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  )
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin))
        if (existing) {
          existing.focus()
          existing.navigate(url)
        } else {
          self.clients.openWindow(url)
        }
      })
  )
})
