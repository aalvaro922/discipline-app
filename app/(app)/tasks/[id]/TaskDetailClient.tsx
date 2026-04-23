'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, Camera, CheckCircle2, Circle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CompleteTaskModal } from '@/components/tasks/CompleteTaskModal'
import { formatTime, formatDate, isOverdue } from '@/lib/utils'
import type { Habit, TaskLog } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface Props {
  habit: Habit
  log: TaskLog | null
  recentLogs: TaskLog[]
  userId: string
}

export function TaskDetailClient({ habit, log, recentLogs, userId }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const isCompleted = log?.status === 'completed'
  const isMissed    = log?.status === 'missed'
  const overdue     = !isCompleted && !isMissed && isOverdue(habit.scheduled_time)

  return (
    <div className="px-5 py-5 space-y-5">
      {/* Back */}
      <div className="flex items-center gap-3 pt-safe">
        <Link href="/tasks" className="p-2 -ml-2 rounded-xl hover:bg-surface-2 text-muted">
          <ArrowLeft size={20} />
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">{habit.name}</h1>
        {habit.description && (
          <p className="text-muted text-sm mt-1">{habit.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-sm text-muted">
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          {formatTime(habit.scheduled_time)}
        </div>
        {habit.requires_photo && (
          <div className="flex items-center gap-1.5">
            <Camera size={14} />
            Foto obligatoria
          </div>
        )}
      </div>

      {/* Status */}
      <div className={`rounded-2xl p-4 border ${
        isCompleted ? 'border-white/20 bg-white/5' :
        overdue     ? 'border-zinc-600 bg-surface'  :
        'border-border bg-surface'
      }`}>
        <div className="flex items-center gap-3">
          {isCompleted
            ? <CheckCircle2 size={22} className="text-white shrink-0" />
            : <Circle size={22} className="text-zinc-600 shrink-0" />
          }
          <div>
            <p className="font-medium">
              {isCompleted ? 'Completada' : isMissed ? 'No completada' : overdue ? 'Atrasada' : 'Pendiente'}
            </p>
            {isCompleted && log?.completed_at && (
              <p className="text-xs text-muted mt-0.5">
                {format(parseISO(log.completed_at), 'HH:mm')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Photo proof */}
      {isCompleted && log?.photo_url && (
        <div className="rounded-2xl overflow-hidden border border-border">
          <p className="text-xs text-muted px-4 pt-3 pb-2">Foto de prueba</p>
          <Image
            src={log.photo_url}
            alt="Prueba"
            width={600}
            height={400}
            className="w-full h-64 object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Notes */}
      {isCompleted && log?.notes && (
        <div className="bg-surface rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted mb-1">Notas</p>
          <p className="text-sm">{log.notes}</p>
        </div>
      )}

      {/* Action */}
      {!isCompleted && !isMissed && (
        <Button variant="primary" size="lg" className="w-full" onClick={() => setModalOpen(true)}>
          {habit.requires_photo ? (
            <><Camera size={17} /> Subir foto y completar</>
          ) : (
            <><CheckCircle2 size={17} /> Marcar como completada</>
          )}
        </Button>
      )}

      {/* History */}
      {recentLogs.length > 1 && (
        <section>
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Historial reciente</p>
          <div className="space-y-2">
            {recentLogs.slice(1).map(l => (
              <div key={l.id} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border">
                <span className="text-sm text-muted">{formatDate(l.log_date)}</span>
                <span className={`text-xs font-medium ${
                  l.status === 'completed' ? 'text-white' :
                  l.status === 'missed'    ? 'text-zinc-600' : 'text-muted'
                }`}>
                  {l.status === 'completed' ? 'Hecha' : l.status === 'missed' ? 'Fallada' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <CompleteTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        habit={habit}
        log={log}
        userId={userId}
      />
    </div>
  )
}
