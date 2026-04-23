import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: { title: string; body: string; icon?: string; data?: Record<string, unknown> }
) {
  if (!subscription.endpoint) return

  await webpush.sendNotification(
    subscription as Parameters<typeof webpush.sendNotification>[0],
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon ?? '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: payload.data ?? {},
    })
  )
}
