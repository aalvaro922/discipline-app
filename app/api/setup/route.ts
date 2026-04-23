import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULT_HABITS = [
  { name: 'Levantarme',              description: 'Levantarme y empezar el día',               scheduled_time: '08:30', order_index: 0 },
  { name: 'Bloque clave TeneriTech', description: 'Trabajo importante del día',                scheduled_time: '09:00', order_index: 1 },
  { name: 'Sacar al perro - mañana', description: 'Paseo de la mañana',                        scheduled_time: '09:30', order_index: 2 },
  { name: 'Deporte / actividad',     description: 'Gimnasio, paseo, surf o actividad física',   scheduled_time: '11:30', order_index: 3 },
  { name: 'Bloque secundario',       description: 'Contenido, mejoras, aprendizaje práctico',   scheduled_time: '15:30', order_index: 4 },
  { name: 'Sacar al perro - tarde',  description: 'Paseo de la tarde',                          scheduled_time: '16:30', order_index: 5 },
  { name: 'Sacar al perro - noche',  description: 'Paseo de la noche',                          scheduled_time: '22:30', order_index: 6 },
  { name: 'Desconectar',             description: 'Apagar el día y prepararme para dormir',     scheduled_time: '00:30', order_index: 7 },
  { name: 'Dormir',                  description: 'Irme a dormir',                              scheduled_time: '01:00', order_index: 8 },
]

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user already has habits
  const { count } = await supabase
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ initialized: false, message: 'Already set up' })
  }

  // Create default habits
  const { error: habitsError } = await supabase
    .from('habits')
    .insert(DEFAULT_HABITS.map(h => ({ ...h, user_id: user.id })))

  if (habitsError) return NextResponse.json({ error: habitsError.message }, { status: 500 })

  // Create streak row
  await supabase
    .from('streaks')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })

  return NextResponse.json({ initialized: true })
}
