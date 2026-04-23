import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { TaskCard } from '@/components/tasks/TaskCard'
import { NotificationSetup } from '@/components/layout/NotificationSetup'
import { Flame, Trophy } from 'lucide-react'
import { formatDate, todayString, todayDayOfWeek, isHabitScheduledToday, computeDaySummary, sortHabitsByTime } from '@/lib/utils'
import type { Habit, TaskLog } from '@/lib/types'

export const revalidate = 0

async function ensureUserSetup(supabase: ReturnType<typeof createClient>, userId: string) {
  const { count } = await supabase
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) === 0) {
    const defaults = [
      { name: 'Levantarme',              description: 'Levantarme y empezar el día',              scheduled_time: '08:30', order_index: 0 },
      { name: 'Bloque clave TeneriTech', description: 'Trabajo importante del día',               scheduled_time: '09:00', order_index: 1 },
      { name: 'Sacar al perro - mañana', description: 'Paseo de la mañana',                       scheduled_time: '09:30', order_index: 2 },
      { name: 'Deporte / actividad',     description: 'Gimnasio, paseo, surf o actividad física',  scheduled_time: '11:30', order_index: 3 },
      { name: 'Bloque secundario',       description: 'Contenido, mejoras, aprendizaje práctico',  scheduled_time: '15:30', order_index: 4 },
      { name: 'Sacar al perro - tarde',  description: 'Paseo de la tarde',                         scheduled_time: '16:30', order_index: 5 },
      { name: 'Sacar al perro - noche',  description: 'Paseo de la noche',                         scheduled_time: '22:30', order_index: 6 },
      { name: 'Desconectar',             description: 'Apagar el día y prepararme para dormir',    scheduled_time: '00:30', order_index: 7 },
      { name: 'Dormir',                  description: 'Irme a dormir',                             scheduled_time: '01:00', order_index: 8 },
    ]
    await supabase.from('habits').insert(defaults.map(h => ({ ...h, user_id: userId })))
    await supabase.from('streaks').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
  }
}

async function ensureTodayLogs(supabase: ReturnType<typeof createClient>, userId: string, habits: Habit[]) {
  const today = todayString()
  const dow = todayDayOfWeek()
  const todayHabits = habits.filter(h => h.is_active && h.repeat_days.includes(dow))
  for (const habit of todayHabits) {
    await supabase
      .from('task_logs')
      .upsert({ user_id: userId, habit_id: habit.id, log_date: today, status: 'pending' },
               { onConflict: 'habit_id,log_date', ignoreDuplicates: true })
  }
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  await ensureUserSetup(supabase, user.id)

  const { data: habits = [] } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  await ensureTodayLogs(supabase, user.id, habits as Habit[])

  const today = todayString()
  const { data: logs = [] } = await supabase
    .from('task_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', today)

  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  const { data: weekLogs = [] } = await supabase
    .from('task_logs')
    .select('log_date, status')
    .eq('user_id', user.id)
    .gte('log_date', weekStart.toISOString().split('T')[0])

  const todayHabits = sortHabitsByTime((habits as Habit[]).filter(h => isHabitScheduledToday(h)))
  const summary = computeDaySummary(logs as TaskLog[], today)
  const logMap = new Map((logs as TaskLog[]).map(l => [l.habit_id, l]))
  const pending = todayHabits.filter(h => logMap.get(h.id)?.status !== 'completed')

  return (
    <div className="px-5 py-5 space-y-6">
      <Header
        title="Hoy"
        subtitle={formatDate(today)}
        right={<NotificationSetup />}
      />

      {/* Progress */}
      {summary.total > 0 && (
        <div className="bg-surface rounded-2xl p-5 border border-border">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-muted mb-1">
                {summary.isPerfect ? 'Día perfecto' : pending.length > 0 ? `${pending.length} pendiente${pending.length > 1 ? 's' : ''}` : 'Completado'}
              </p>
              <p className="text-4xl font-bold tracking-tight">{summary.percentage}%</p>
            </div>
            <p className="text-sm text-muted pb-1">{summary.completed}/{summary.total}</p>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${summary.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Streaks */}
      {streak && (streak.current_streak > 0 || streak.max_streak > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted mb-2">Racha actual</p>
            <p className="text-3xl font-bold">{streak.current_streak}</p>
            <p className="text-xs text-muted mt-0.5">días</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted mb-2">Mejor racha</p>
            <p className="text-3xl font-bold">{streak.max_streak}</p>
            <p className="text-xs text-muted mt-0.5">días</p>
          </div>
        </div>
      )}

      {/* Task list */}
      <section>
        <p className="text-xs text-muted uppercase tracking-widest mb-3">Tareas de hoy</p>
        {todayHabits.length === 0 ? (
          <p className="text-muted text-sm text-center py-12">No hay tareas para hoy</p>
        ) : (
          <div className="space-y-2">
            {todayHabits.map(habit => (
              <TaskCard key={habit.id} habit={habit} log={logMap.get(habit.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Week strip */}
      <section className="bg-surface rounded-2xl p-4 border border-border">
        <p className="text-xs text-muted uppercase tracking-widest mb-4">Últimos 7 días</p>
        <WeekStrip logs={weekLogs as TaskLog[]} />
      </section>
    </div>
  )
}

function WeekStrip({ logs }: { logs: TaskLog[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const dayLogs = logs.filter(l => l.log_date === dateStr)
    const completed = dayLogs.filter(l => l.status === 'completed').length
    const total = dayLogs.length
    return {
      label: d.toLocaleDateString('es', { weekday: 'narrow' }),
      dateStr,
      completed,
      total,
      isToday: dateStr === todayString(),
      isPerfect: total > 0 && completed === total,
    }
  })

  return (
    <div className="flex justify-between">
      {days.map(day => (
        <div key={day.dateStr} className="flex flex-col items-center gap-1.5">
          <span className={`text-[10px] uppercase ${day.isToday ? 'text-white font-semibold' : 'text-muted'}`}>
            {day.label}
          </span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold border ${
            day.isPerfect
              ? 'bg-white border-white text-black'
              : day.completed > 0
              ? 'bg-surface-2 border-zinc-600 text-zinc-300'
              : day.isToday
              ? 'bg-surface-2 border-border text-muted'
              : 'bg-transparent border-border/30 text-muted/30'
          }`}>
            {day.total > 0 ? day.completed : '·'}
          </div>
        </div>
      ))}
    </div>
  )
}
