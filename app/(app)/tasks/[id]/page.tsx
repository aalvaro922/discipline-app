import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TaskDetailClient } from './TaskDetailClient'
import { todayString } from '@/lib/utils'
import type { Habit, TaskLog } from '@/lib/types'

export const revalidate = 0

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!habit) notFound()

  const today = todayString()
  const { data: log } = await supabase
    .from('task_logs')
    .select('*')
    .eq('habit_id', params.id)
    .eq('log_date', today)
    .maybeSingle()

  // Recent logs for history panel
  const { data: recentLogs = [] } = await supabase
    .from('task_logs')
    .select('*')
    .eq('habit_id', params.id)
    .order('log_date', { ascending: false })
    .limit(10)

  return (
    <TaskDetailClient
      habit={habit as Habit}
      log={log as TaskLog | null}
      recentLogs={recentLogs as TaskLog[]}
      userId={user.id}
    />
  )
}
