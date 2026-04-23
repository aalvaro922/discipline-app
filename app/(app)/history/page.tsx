import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import Image from 'next/image'
import { Clock, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { TaskLog } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 0

export default async function HistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: logs = [] } = await supabase
    .from('task_logs')
    .select('*, habit:habits(*)')
    .eq('user_id', user.id)
    .neq('log_date', new Date().toISOString().split('T')[0])
    .order('log_date', { ascending: false })
    .limit(200)

  const grouped = new Map<string, TaskLog[]>()
  for (const log of logs as TaskLog[]) {
    const arr = grouped.get(log.log_date) ?? []
    arr.push(log)
    grouped.set(log.log_date, arr)
  }
  const sortedDates = [...grouped.keys()].sort((a, b) => b.localeCompare(a))

  return (
    <div className="px-5 py-5 space-y-6">
      <Header title="Historial" />

      {sortedDates.length === 0 ? (
        <p className="text-muted text-sm text-center py-16">Sin historial todavía</p>
      ) : (
        sortedDates.map(date => {
          const dayLogs = grouped.get(date)!
          const completed = dayLogs.filter(l => l.status === 'completed').length
          const total = dayLogs.length
          const isPerfect = completed === total && total > 0

          return (
            <section key={date}>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-sm font-semibold capitalize">
                  {format(parseISO(date + 'T12:00:00'), "EEEE d MMM", { locale: es })}
                </p>
                <div className="flex items-center gap-2">
                  {isPerfect && <span className="text-[10px] uppercase tracking-widest text-white">Perfecto</span>}
                  <span className="text-xs text-muted">{completed}/{total}</span>
                </div>
              </div>

              <div className="space-y-2">
                {dayLogs.map(log => {
                  const habit = log.habit!
                  return (
                    <div key={log.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          log.status === 'completed' ? 'bg-white' : 'bg-zinc-700'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            log.status === 'completed' ? 'text-white' : 'text-zinc-500'
                          }`}>
                            {habit.name}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {log.completed_at
                              ? `${format(parseISO(log.completed_at), 'HH:mm')}`
                              : formatTime(habit.scheduled_time)}
                          </p>
                        </div>
                        <span className={`text-xs font-medium shrink-0 ${
                          log.status === 'completed' ? 'text-zinc-400' : 'text-zinc-600'
                        }`}>
                          {log.status === 'completed' ? 'Hecha' : log.status === 'missed' ? 'Fallada' : '—'}
                        </span>
                      </div>
                      {log.photo_url && (
                        <Image
                          src={log.photo_url}
                          alt="Prueba"
                          width={400}
                          height={160}
                          className="w-full h-40 object-cover border-t border-border"
                          unoptimized
                        />
                      )}
                      {log.notes && (
                        <p className="px-4 pb-3 pt-2 text-xs text-muted border-t border-border">{log.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
