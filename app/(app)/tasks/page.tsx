import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { TaskCard } from '@/components/tasks/TaskCard'
import { todayString, todayDayOfWeek, sortHabitsByTime } from '@/lib/utils'
import type { Habit, TaskLog } from '@/lib/types'

export const revalidate = 0

export default async function TasksPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dow = todayDayOfWeek()
  const { data: habits = [] } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .contains('repeat_days', [dow])

  const today = todayString()
  const { data: logs = [] } = await supabase
    .from('task_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', today)

  const logMap = new Map((logs as TaskLog[]).map(l => [l.habit_id, l]))
  const sorted = sortHabitsByTime(habits as Habit[])
  const pending   = sorted.filter(h => logMap.get(h.id)?.status !== 'completed')
  const completed = sorted.filter(h => logMap.get(h.id)?.status === 'completed')

  return (
    <div className="px-5 py-5 space-y-6">
      <Header
        title="Tareas de hoy"
        subtitle={`${completed.length} de ${sorted.length} completadas`}
      />

      {pending.length > 0 && (
        <section>
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Pendientes</p>
          <div className="space-y-2">
            {pending.map(habit => (
              <TaskCard key={habit.id} habit={habit} log={logMap.get(habit.id)} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Completadas</p>
          <div className="space-y-2 opacity-60">
            {completed.map(habit => (
              <TaskCard key={habit.id} habit={habit} log={logMap.get(habit.id)} />
            ))}
          </div>
        </section>
      )}

      {sorted.length === 0 && (
        <p className="text-muted text-sm text-center py-16">No hay tareas hoy</p>
      )}
    </div>
  )
}
