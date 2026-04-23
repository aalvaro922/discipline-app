import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('order_index')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: body.name,
      description: body.description ?? '',
      scheduled_time: body.scheduled_time,
      repeat_days: body.repeat_days ?? [0, 1, 2, 3, 4, 5, 6],
      requires_photo: body.requires_photo ?? true,
      is_active: body.is_active ?? true,
      order_index: body.order_index ?? 999,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
