import Link from 'next/link'
import { Clock, Camera } from 'lucide-react'
import { formatTime, isOverdue } from '@/lib/utils'
import type { Habit, TaskLog } from '@/lib/types'

interface TaskCardProps {
  habit: Habit
  log?: TaskLog
}

export function TaskCard({ habit, log }: TaskCardProps) {
  const status = log?.status ?? 'pending'
  const overdue = status === 'pending' && isOverdue(habit.scheduled_time)

  return (
    <Link
      href={`/tasks/${habit.id}`}
      className="card-press flex items-center gap-4 rounded-2xl px-4 py-4 border border-border bg-surface transition-colors hover:border-zinc-600"
    >
      {/* Status dot */}
      <div className={`shrink-0 w-2.5 h-2.5 rounded-full ${
        status === 'completed' ? 'bg-white' :
        overdue               ? 'bg-zinc-500 animate-pulse' :
        'bg-zinc-700'
      }`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${
          status === 'completed' ? 'text-zinc-400 line-through' : 'text-white'
        }`}>
          {habit.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock size={11} className="text-muted shrink-0" />
          <span className="text-xs text-muted">{formatTime(habit.scheduled_time)}</span>
          {habit.requires_photo && status !== 'completed' && (
            <>
              <span className="text-muted text-xs">·</span>
              <Camera size={11} className="text-muted shrink-0" />
            </>
          )}
        </div>
      </div>

      {/* Right label */}
      <span className={`text-xs font-medium shrink-0 ${
        status === 'completed' ? 'text-zinc-500' :
        overdue               ? 'text-zinc-400' :
        'text-zinc-600'
      }`}>
        {status === 'completed' ? 'Hecha' : overdue ? 'Atrasada' : formatTime(habit.scheduled_time)}
      </span>
    </Link>
  )
}
