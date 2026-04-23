import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from './SettingsClient'
import type { Habit } from '@/lib/types'

export const revalidate = 0

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: habits = [] } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('order_index')

  return (
    <div className="px-5 py-4 space-y-6">
      <Header title="Configuración" subtitle="Gestiona tus hábitos y alertas" />
      <SettingsClient habits={habits as Habit[]} userId={user.id} />
    </div>
  )
}
