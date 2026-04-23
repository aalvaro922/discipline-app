'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

export function NotificationSetup() {
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') setStatus('granted')
    else if (Notification.permission === 'denied') setStatus('denied')
  }, [])

  async function requestPermission() {
    if (status === 'unsupported') return
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') { setStatus('denied'); return }

    setStatus('granted')

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Browser',
        }),
      })
    } catch (err) {
      console.error('Push subscription failed:', err)
    }
  }

  if (status === 'unsupported') return null
  if (status === 'granted') return (
    <div className="flex items-center gap-1 text-xs text-muted">
      <Bell size={14} className="text-accent" />
    </div>
  )

  return (
    <button
      onClick={requestPermission}
      className="flex items-center gap-1.5 text-xs text-muted hover:text-white bg-surface-2 px-3 py-1.5 rounded-lg border border-border"
    >
      <BellOff size={14} />
      Activar alertas
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
