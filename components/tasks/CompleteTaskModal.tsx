'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { PhotoUpload } from './PhotoUpload'
import { Button } from '@/components/ui/Button'
import type { Habit, TaskLog } from '@/lib/types'
import { todayString } from '@/lib/utils'

interface CompleteTaskModalProps {
  open: boolean
  onClose: () => void
  habit: Habit
  log: TaskLog | null
  userId: string
}

export function CompleteTaskModal({ open, onClose, habit, log, userId }: CompleteTaskModalProps) {
  const router = useRouter()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleUploaded(url: string, path: string) {
    setPhotoUrl(url)
    setPhotoPath(path)
  }

  async function handleConfirm() {
    if (habit.requires_photo && !photoUrl) {
      setError('Debes subir una foto para completar esta tarea.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/logs', {
        method: log ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId: habit.id,
          logDate: todayString(),
          status: 'completed',
          photoUrl,
          photoPath,
          notes: notes.trim() || null,
          logId: log?.id,
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      router.refresh()
      onClose()
    } catch (err) {
      setError('Error al guardar. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Completar: ${habit.name}`}>
      <div className="space-y-5">
        {habit.requires_photo ? (
          <>
            <p className="text-sm text-muted">
              Sube una foto como prueba para marcar esta tarea como completada.
            </p>
            <PhotoUpload
              habitId={habit.id}
              logDate={todayString()}
              userId={userId}
              onUploaded={handleUploaded}
            />
            {photoUrl && (
              <p className="text-xs text-accent text-center">✓ Foto subida correctamente</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Confirma que has completado esta tarea.</p>
        )}

        <textarea
          placeholder="Notas opcionales…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted resize-none focus:outline-none focus:border-accent"
        />

        {error && <p className="text-sm text-danger text-center">{error}</p>}

        {(!habit.requires_photo || photoUrl) && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={saving}
            onClick={handleConfirm}
          >
            Marcar como completada
          </Button>
        )}
      </div>
    </Modal>
  )
}
