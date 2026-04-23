'use client'

import { useMemo } from 'react'
import { CompletionChart } from '@/components/stats/CompletionChart'
import { computeDaySummary } from '@/lib/utils'
import type { TaskLog, Streak, DaySummary } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  logs: TaskLog[]
  streak: Streak | null
}

export function StatsClient({ logs, streak }: Props) {
  const { daySummaries, totalCompleted, totalMissed, habitStats, perfectDays } = useMemo(() => {
    const dates = [...new Set(logs.map(l => l.log_date))].sort()
    const daySummaries: DaySummary[] = dates.map(date =>
      computeDaySummary(logs.filter(l => l.log_date === date), date)
    )
    const totalCompleted = logs.filter(l => l.status === 'completed').length
    const totalMissed    = logs.filter(l => l.status === 'missed').length
    const perfectDays    = daySummaries.filter(d => d.isPerfect)

    const habitMap = new Map<string, { name: string; completed: number; missed: number; times: string[] }>()
    for (const log of logs) {
      const name = (log.habit as any)?.name ?? log.habit_id
      const entry = habitMap.get(log.habit_id) ?? { name, completed: 0, missed: 0, times: [] }
      if (log.status === 'completed') { entry.completed++; if (log.completed_at) entry.times.push(log.completed_at) }
      if (log.status === 'missed') entry.missed++
      habitMap.set(log.habit_id, entry)
    }

    const habitStats = [...habitMap.values()]
      .map(h => ({
        ...h,
        total: h.completed + h.missed,
        rate: h.completed + h.missed > 0 ? Math.round(h.completed / (h.completed + h.missed) * 100) : 0,
      }))
      .filter(h => h.total > 0)

    return { daySummaries, totalCompleted, totalMissed, habitStats, perfectDays }
  }, [logs])

  const overallRate = totalCompleted + totalMissed > 0
    ? Math.round(totalCompleted / (totalCompleted + totalMissed) * 100)
    : 0

  return (
    <div className="space-y-5">
      {/* Top numbers */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Completadas" value={totalCompleted} />
        <Stat label="Falladas" value={totalMissed} />
        <Stat label="Cumplimiento" value={`${overallRate}%`} />
        <Stat label="Racha actual" value={streak?.current_streak ?? 0} unit="días" />
        <Stat label="Mejor racha" value={streak?.max_streak ?? 0} unit="días" />
        <Stat label="Días perfectos" value={streak?.perfect_days_count ?? 0} />
      </div>

      {/* 7-day chart */}
      <section className="bg-surface rounded-2xl p-4 border border-border">
        <p className="text-xs text-muted uppercase tracking-widest mb-4">Últimos 7 días</p>
        {daySummaries.slice(-7).length > 0
          ? <CompletionChart data={daySummaries.slice(-7)} type="bar" />
          : <p className="text-muted text-sm text-center py-8">Sin datos</p>}
      </section>

      {/* Trend */}
      <section className="bg-surface rounded-2xl p-4 border border-border">
        <p className="text-xs text-muted uppercase tracking-widest mb-4">Tendencia mensual</p>
        {daySummaries.length > 0
          ? <CompletionChart data={daySummaries} type="line" />
          : <p className="text-muted text-sm text-center py-8">Sin datos</p>}
      </section>

      {/* Perfect days */}
      {perfectDays.length > 0 && (
        <section className="bg-surface rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Días perfectos</p>
          <div className="flex flex-wrap gap-2">
            {perfectDays.map(d => (
              <span key={d.date} className="text-xs bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded-full">
                {format(parseISO(d.date + 'T12:00:00'), 'd MMM', { locale: es })}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Habit ranking */}
      {habitStats.length > 0 && (
        <section className="bg-surface rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted uppercase tracking-widest mb-4">Por hábito</p>
          <div className="space-y-4">
            {[...habitStats].sort((a, b) => b.rate - a.rate).map(h => (
              <div key={h.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="truncate flex-1 mr-2 text-zinc-300">{h.name}</span>
                  <span className="text-zinc-400 shrink-0">{h.rate}%</span>
                </div>
                <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${h.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="bg-surface rounded-2xl p-4 border border-border">
      <p className="text-xs text-muted mb-2">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {unit && <p className="text-xs text-muted mt-0.5">{unit}</p>}
    </div>
  )
}
