import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const date = searchParams.get('date')

  let query = supabase
    .from('task_logs')
    .select('*, habit:habits(*)')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })

  if (date) query = query.eq('log_date', date)
  if (from) query = query.gte('log_date', from)
  if (to)   query = query.lte('log_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('task_logs')
    .upsert({
      user_id: user.id,
      habit_id: body.habitId,
      log_date: body.logDate,
      status: body.status,
      completed_at: body.status === 'completed' ? new Date().toISOString() : null,
      photo_url: body.photoUrl ?? null,
      photo_path: body.photoPath ?? null,
      notes: body.notes ?? null,
    }, { onConflict: 'habit_id,log_date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update streak if completed
  if (body.status === 'completed') {
    await updateStreak(supabase, user.id, body.logDate)
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const updatePayload: Record<string, unknown> = {
    status: body.status,
  }
  if (body.status === 'completed') {
    updatePayload.completed_at = new Date().toISOString()
    updatePayload.photo_url = body.photoUrl ?? null
    updatePayload.photo_path = body.photoPath ?? null
    updatePayload.notes = body.notes ?? null
  }

  const { data, error } = await supabase
    .from('task_logs')
    .upsert({
      user_id: user.id,
      habit_id: body.habitId,
      log_date: body.logDate,
      ...updatePayload,
    }, { onConflict: 'habit_id,log_date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.status === 'completed') {
    await updateStreak(supabase, user.id, body.logDate)
  }

  return NextResponse.json(data)
}

async function updateStreak(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  logDate: string
) {
  // Get all habits active for today
  const dow = new Date(logDate + 'T12:00:00').getDay()
  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('repeat_days', [dow])

  if (!habits || habits.length === 0) return

  // Get today's logs
  const { data: logs } = await supabase
    .from('task_logs')
    .select('status')
    .eq('user_id', userId)
    .eq('log_date', logDate)

  const isPerfectDay =
    logs &&
    habits.length === logs.length &&
    logs.every((l) => l.status === 'completed')

  if (!isPerfectDay) return

  // Fetch current streak
  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!streak) return

  const yesterday = new Date(logDate + 'T12:00:00')
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const consecutive = streak.last_perfect_day === yesterdayStr
    ? streak.current_streak + 1
    : 1

  await supabase
    .from('streaks')
    .update({
      current_streak: consecutive,
      max_streak: Math.max(streak.max_streak, consecutive),
      last_perfect_day: logDate,
      perfect_days_count: streak.perfect_days_count + (streak.last_perfect_day === logDate ? 0 : 1),
    })
    .eq('user_id', userId)
}
