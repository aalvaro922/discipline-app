import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DaySummary, TaskLog, Habit } from './types'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "d 'de' MMMM, yyyy", { locale: es })
}

export function formatTime(time: string): string {
  // 'HH:MM' → '9:00 AM' style (12h)
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function todayDayOfWeek(): number {
  return new Date().getDay() // 0=Sun, 6=Sat
}

export function isHabitScheduledToday(habit: Habit): boolean {
  return habit.repeat_days.includes(todayDayOfWeek())
}

export function isOverdue(scheduledTime: string): boolean {
  const now = new Date()
  const [h, m] = scheduledTime.split(':').map(Number)
  const scheduled = new Date()
  scheduled.setHours(h, m, 0, 0)
  return isBefore(scheduled, now)
}

export function computeDaySummary(
  logs: TaskLog[],
  date: string = todayString()
): DaySummary {
  const dayLogs = logs.filter((l) => l.log_date === date)
  const total = dayLogs.length
  const completed = dayLogs.filter((l) => l.status === 'completed').length
  const missed = dayLogs.filter((l) => l.status === 'missed').length
  const pending = dayLogs.filter((l) => l.status === 'pending').length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const isPerfect = total > 0 && completed === total

  return { date, total, completed, missed, pending, percentage, isPerfect }
}

export function getStatusColor(status: string): string {
  if (status === 'completed') return 'text-accent'
  if (status === 'missed') return 'text-danger'
  return 'text-warn'
}

export function getStatusLabel(status: string): string {
  if (status === 'completed') return 'Completada'
  if (status === 'missed') return 'Fallada'
  return 'Pendiente'
}

export function getDayLabel(dayIndex: number): string {
  return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayIndex]
}

export function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Converts HH:MM to sortable minutes — treats 00:00–05:59 as next-day
export function timeToSortMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  const mins = h * 60 + m
  return h < 6 ? mins + 24 * 60 : mins
}

export function sortHabitsByTime<T extends { scheduled_time: string }>(habits: T[]): T[] {
  return [...habits].sort((a, b) => timeToSortMinutes(a.scheduled_time) - timeToSortMinutes(b.scheduled_time))
}
