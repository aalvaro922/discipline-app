import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { StatsClient } from './StatsClient'
import type { TaskLog, Streak } from '@/lib/types'

export const revalidate = 0

export default async function StatsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Last 30 days
  const from = new Date()
  from.setDate(from.getDate() - 29)
  const fromStr = from.toISOString().split('T')[0]

  const { data: logs = [] } = await supabase
    .from('task_logs')
    .select('*, habit:habits(name, scheduled_time)')
    .eq('user_id', user.id)
    .gte('log_date', fromStr)
    .order('log_date')

  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="px-5 py-4 space-y-6">
      <Header title="Estadísticas" subtitle="Últimos 30 días" />
      <StatsClient logs={logs as TaskLog[]} streak={streak as Streak | null} />
    </div>
  )
}
