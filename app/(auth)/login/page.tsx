'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email o contraseña incorrectos.')
        setLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setDone(true)
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 pt-safe pb-safe">
      <div className="mb-10 text-center">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl">
          🎯
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Disciplina</h1>
        <p className="text-muted text-sm mt-1">Sistema de hábitos personal</p>
      </div>

      {done ? (
        <div className="w-full max-w-sm text-center space-y-4">
          <p className="text-sm text-zinc-300">Cuenta creada. Revisa tu email para confirmar y vuelve a iniciar sesión.</p>
          <Button variant="secondary" size="md" className="w-full" onClick={() => { setDone(false); setMode('login') }}>
            Ir a iniciar sesión
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full h-12 bg-surface border border-border rounded-xl px-4 text-white placeholder:text-muted focus:outline-none focus:border-zinc-500 transition-colors text-sm"
          />
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Contraseña"
            className="w-full h-12 bg-surface border border-border rounded-xl px-4 text-white placeholder:text-muted focus:outline-none focus:border-zinc-500 transition-colors text-sm"
          />

          {error && (
            <p className="text-xs text-zinc-400 text-center bg-surface-2 px-4 py-2.5 rounded-xl border border-border">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-1">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>

          <button
            type="button"
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null) }}
            className="w-full text-xs text-muted hover:text-zinc-300 text-center py-2"
          >
            {mode === 'login' ? '¿Sin cuenta? Crear una' : '¿Ya tienes cuenta? Entrar'}
          </button>
        </form>
      )}
    </div>
  )
}
