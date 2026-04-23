import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push'
import { NextResponse } from 'next/server'

// This endpoint is called by a cron job (Vercel Cron / external scheduler)
// to send reminders at habit scheduled times.
// Protect it with a secret header.

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-cron-secret')
  if (authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient()

  // Get all active habits scheduled for the current time (±5 min window)
  const now = new Date()
  const hh = now.getHours().toString().padStart(2, '0')
  const mm = now.getMinutes().toString().padStart(2, '0')
  const windowStart = `${hh}:${String(Math.max(0, now.getMinutes() - 5)).padStart(2, '0')}`
  const windowEnd   = `${hh}:${String(Math.min(59, now.getMinutes() + 5)).padStart(2, '0')}`
  const today = now.toISOString().split('T')[0]
  const dow = now.getDay()

  const { data: habits } = await supabase
    .from('habits')
    .select('*, user_id')
    .eq('is_active', true)
    .contains('repeat_days', [dow])
    .gte('scheduled_time', windowStart)
    .lte('scheduled_time', windowEnd)

  if (!habits?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const habit of habits) {
    // Skip if already completed today
    const { data: log } = await supabase
      .from('task_logs')
      .select('status')
      .eq('habit_id', habit.id)
      .eq('log_date', today)
      .single()

    if (log?.status === 'completed') continue

    // Get user's push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', habit.user_id)

    for (const sub of subs ?? []) {
      try {
        await sendPushNotification(sub.subscription as PushSubscriptionJSON, {
          title: `⏰ ${habit.name}`,
          body: habit.description || 'Es hora de completar esta tarea.',
          data: { habitId: habit.id, url: `/tasks/${habit.id}` },
        })
        sent++
      } catch (err) {
        console.error('Push failed:', err)
      }
    }
  }

  return NextResponse.json({ sent })
}
