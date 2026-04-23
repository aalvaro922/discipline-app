'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface PhotoUploadProps {
  habitId: string
  logDate: string
  userId: string
  onUploaded: (url: string, path: string) => void
}

export function PhotoUpload({ habitId, logDate, userId, onUploaded }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  function clearPhoto() {
    setFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${logDate}/${habitId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('habit-photos')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: signed, error: signErr } = await supabase.storage
        .from('habit-photos')
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10) // 10 años

      if (signErr) throw signErr

      onUploaded(signed.signedUrl, path)
    } catch (err) {
      setError('Error al subir la foto. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seleccionar foto"
          />
          <div className="flex flex-col items-center justify-center gap-3 h-44 rounded-2xl border-2 border-dashed border-border bg-surface-2 text-muted">
            <Camera size={36} strokeWidth={1.4} />
            <div className="text-center">
              <p className="font-medium text-white">Hacer foto / Elegir de galería</p>
              <p className="text-xs mt-1">Toca para abrir la cámara o galería</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden">
          <Image
            src={preview}
            alt="Previsualización"
            width={400}
            height={300}
            className="w-full h-56 object-cover"
            unoptimized
          />
          <button
            onClick={clearPhoto}
            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-danger text-center">{error}</p>}

      {preview && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={uploading}
          onClick={handleUpload}
        >
          <Check size={18} />
          {uploading ? 'Subiendo foto…' : 'Confirmar con esta foto'}
        </Button>
      )}

      {/* Also allow picking from gallery explicitly (without capture) */}
      {!preview && (
        <button
          className="w-full text-sm text-muted flex items-center justify-center gap-2 py-2"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.removeAttribute('capture')
              inputRef.current.click()
            }
          }}
        >
          <Upload size={14} /> Subir desde galería
        </button>
      )}
    </div>
  )
}
