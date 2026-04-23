export interface Habit {
  id: string
  user_id: string
  name: string
  description: string
  scheduled_time: string   // 'HH:MM'
  repeat_days: number[]    // 0=Sun … 6=Sat
  requires_photo: boolean
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export type LogStatus = 'pending' | 'completed' | 'missed'

export interface TaskLog {
  id: string
  user_id: string
  habit_id: string
  log_date: string         // 'YYYY-MM-DD'
  status: LogStatus
  completed_at: string | null
  photo_url: string | null
  photo_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
  habit?: Habit
}

export interface Streak {
  id: string
  user_id: string
  current_streak: number
  max_streak: number
  last_perfect_day: string | null
  perfect_days_count: number
  updated_at: string
}

export interface DaySummary {
  date: string
  total: number
  completed: number
  missed: number
  pending: number
  percentage: number
  isPerfect: boolean
}

export interface TodayData {
  habits: Habit[]
  logs: TaskLog[]
  streak: Streak | null
  summary: DaySummary
}

export interface PushSubscriptionRow {
  id: string
  user_id: string
  subscription: PushSubscriptionJSON
  device_name: string | null
  created_at: string
}
