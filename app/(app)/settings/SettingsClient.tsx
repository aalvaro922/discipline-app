'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, LogOut, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getDayLabel, formatTime, sortHabitsByTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Habit } from '@/lib/types'

const DAYS = [0, 1, 2, 3, 4, 5, 6]
const defaultForm = {
  name: '',
  description: '',
  scheduled_time: '09:00',
  repeat_days: [0, 1, 2, 3, 4, 5, 6] as number[],
  requires_photo: true,
  is_active: true,
}

export function SettingsClient({ habits: initial }: { habits: Habit[]; userId: string }) {
  const router = useRouter()
  const [habits, setHabits] = useState(initial)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openCreate() { setForm(defaultForm); setEditingHabit(null); setModal('create') }
  function openEdit(h: Habit) {
    setEditingHabit(h)
    setForm({ name: h.name, description: h.description ?? '', scheduled_time: h.scheduled_time, repeat_days: h.repeat_days, requires_photo: h.requires_photo, is_active: h.is_active })
    setModal('edit')
  }
  function toggleDay(d: number) {
    setForm(f => ({ ...f, repeat_days: f.repeat_days.includes(d) ? f.repeat_days.filter(x => x !== d) : [...f.repeat_days, d].sort() }))
  }

  async function saveHabit() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingHabit) {
        const res = await fetch(`/api/habits/${editingHabit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const updated = await res.json()
        setHabits(h => h.map(x => x.id === updated.id ? updated : x))
      } else {
        const res = await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, order_index: habits.length }) })
        const created = await res.json()
        setHabits(h => [...h, created])
      }
      setModal(null); router.refresh()
    } finally { setSaving(false) }
  }

  async function deleteHabit(id: string) {
    await fetch(`/api/habits/${id}`, { method: 'DELETE' })
    setHabits(h => h.filter(x => x.id !== id))
    setDeleteId(null); router.refresh()
  }

  async function toggleActive(habit: Habit) {
    const res = await fetch(`/api/habits/${habit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !habit.is_active }) })
    const updated = await res.json()
    setHabits(h => h.map(x => x.id === updated.id ? updated : x))
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sorted = sortHabitsByTime(habits)

  return (
    <div className="space-y-6">
      {/* Habits */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted uppercase tracking-widest">Hábitos</p>
          <Button variant="secondary" size="sm" onClick={openCreate}>
            <Plus size={14} /> Nuevo
          </Button>
        </div>
        <div className="space-y-2">
          {sorted.map(habit => (
            <div key={habit.id} className={`bg-surface rounded-2xl border border-border p-4 ${!habit.is_active ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{habit.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatTime(habit.scheduled_time)} · {habit.repeat_days.length === 7 ? 'Todos los días' : habit.repeat_days.map(getDayLabel).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(habit)} className="p-2 rounded-lg hover:bg-surface-2 text-muted">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteId(habit.id)} className="p-2 rounded-lg hover:bg-surface-2 text-zinc-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <button onClick={() => toggleActive(habit)} className="mt-2 text-xs text-muted hover:text-zinc-300">
                {habit.is_active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-between bg-surface rounded-2xl border border-border px-4 py-4 text-sm text-muted hover:text-white hover:border-zinc-600 transition-colors"
      >
        <div className="flex items-center gap-2"><LogOut size={15} /> Cerrar sesión</div>
        <ChevronRight size={15} />
      </button>

      {/* Create / Edit modal */}
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo hábito' : 'Editar hábito'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">Nombre</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full h-11 bg-surface-2 border border-border rounded-xl px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:border-zinc-500"
              placeholder="Nombre del hábito" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Descripción</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full h-11 bg-surface-2 border border-border rounded-xl px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:border-zinc-500"
              placeholder="Descripción corta" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Hora</label>
            <input type="time" value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
              className="w-full h-11 bg-surface-2 border border-border rounded-xl px-4 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-2">Días</label>
            <div className="flex gap-1.5">
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                    form.repeat_days.includes(d) ? 'bg-white text-black' : 'bg-surface-2 text-muted'
                  }`}>
                  {getDayLabel(d)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between bg-surface-2 rounded-xl px-4 py-3.5">
            <div>
              <p className="text-sm font-medium">Foto obligatoria</p>
              <p className="text-xs text-muted mt-0.5">No se puede completar sin foto</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, requires_photo: !f.requires_photo }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.requires_photo ? 'bg-white' : 'bg-surface'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-transform ${form.requires_photo ? 'left-5 bg-black' : 'left-0.5 bg-zinc-600'}`} />
            </button>
          </div>
          <Button variant="primary" size="lg" className="w-full" loading={saving} onClick={saveHabit}>
            {modal === 'create' ? 'Crear hábito' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Eliminar hábito">
        <p className="text-sm text-muted mb-5">¿Seguro? Se perderá el historial de este hábito.</p>
        <div className="flex gap-3">
          <Button variant="ghost" size="md" className="flex-1" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="secondary" size="md" className="flex-1 border-zinc-600" onClick={() => deleteId && deleteHabit(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
