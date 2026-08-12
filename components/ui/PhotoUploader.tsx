'use client'

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CameraIcon } from '@/components/icons/CameraIcon'
import { PaletteIcon } from '@/components/icons/PaletteIcon'
import { FilmIcon } from '@/components/icons/FilmIcon'

type ActionType = 'restore' | 'animate'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
const MAX_SIZE_MB = 15
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function validateFile(file: File): string | null {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  const typeOk = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)
  if (!typeOk) return 'Solo se aceptan fotos en formato JPG, PNG, WEBP o HEIC.'
  if (file.size > MAX_SIZE_BYTES) return `La foto es demasiado grande. El máximo es ${MAX_SIZE_MB} MB.`
  return null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function truncateName(name: string, max = 36): string {
  if (name.length <= max) return name
  const ext = name.slice(name.lastIndexOf('.'))
  return name.slice(0, max - ext.length - 1) + '…' + ext
}

export function PhotoUploader() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [action, setAction] = useState<ActionType>('restore')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [creditError, setCreditError] = useState(false)

  const handleFile = useCallback((incoming: File) => {
    setError(null)
    const validationError = validateFile(incoming)
    if (validationError) { setError(validationError); return }
    setFile(incoming)
    setPreview(URL.createObjectURL(incoming))
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [handleFile])

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
  }, [handleFile])

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    setCreditError(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!file) return
    setIsSubmitting(true)
    setError(null)
    setCreditError(false)

    try {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('type', action)

      const res = await fetch('/api/jobs', { method: 'POST', body: formData })
      const data: { jobId?: string; error?: string; code?: string } = await res.json()

      if (!res.ok) {
        if (data.code === 'INSUFFICIENT_CREDITS') { setCreditError(true) }
        else { setError(data.error ?? 'Ocurrió un error. Intenta de nuevo.') }
        return
      }

      router.push(`/procesando/${data.jobId}`)
    } catch {
      setError('No se pudo conectar con el servidor. Revisa tu internet e intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (preview && file) {
    return (
      <div className="w-full max-w-lg mx-auto">
        {/* Preview */}
        <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <img src={preview} alt="Vista previa de tu foto" className="w-full h-full object-cover" />
          <button
            onClick={handleReset}
            className="absolute top-3 right-3 bg-white rounded-full w-9 h-9 flex items-center justify-center text-xl leading-none"
            style={{ boxShadow: 'var(--shadow-warm)', color: 'var(--color-bark)' }}
            aria-label="Quitar foto"
          >
            ×
          </button>
        </div>

        {/* Nombre y tamaño del archivo */}
        <p className="text-center mt-2" style={{ fontSize: '0.8rem', color: 'var(--color-bark-muted)' }}>
          {truncateName(file.name)} · {formatFileSize(file.size)}
        </p>

        {/* Selector de acción */}
        <div className="mt-6">
          <p
            className="font-semibold mb-3 text-center"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}
          >
            ¿Qué quieres hacer con esta foto?
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ActionCard
              selected={action === 'restore'}
              onClick={() => setAction('restore')}
              icon={<PaletteIcon size={22} />}
              title="Restaurar y colorear"
              description="Elimina daños, arañazos y agrega color natural"
              badge="Gratis la primera vez"
            />
            <ActionCard
              selected={action === 'animate'}
              onClick={() => setAction('animate')}
              icon={<FilmIcon size={22} />}
              title="Animar en video"
              description="Crea un video corto donde la persona se mueve suavemente"
              badge="3 créditos"
            />
          </div>
        </div>

        {creditError && (
          <div
            className="mt-4 p-4 rounded-lg text-sm"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--color-error)' }}
          >
            No tienes suficientes créditos.{' '}
            <a href="/#precios" style={{ color: 'var(--color-amber)', fontWeight: 600 }}>
              Ver paquetes
            </a>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-center" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn btn-primary w-full mt-5"
          style={{ fontSize: '1.05rem' }}
        >
          {isSubmitting ? (
            <><SpinnerIcon /> Enviando foto…</>
          ) : (
            action === 'restore' ? 'Restaurar esta foto' : 'Crear video animado'
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="sr-only"
        onChange={handleInputChange}
        aria-label="Seleccionar foto"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        className="card flex flex-col items-center justify-center text-center p-10 cursor-pointer"
        style={{
          minHeight: 280,
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: isDragOver ? 'var(--color-amber)' : 'var(--color-sepia-200)',
          background: isDragOver ? 'var(--color-amber-50)' : 'var(--color-warm-white)',
          transition: 'border-color 120ms ease, background 120ms ease',
        }}
        aria-label="Zona para subir tu foto. Haz clic o arrastra una foto aquí."
      >
        <div className="mb-4" style={{ color: 'var(--color-sepia-300)' }}>
          <CameraIcon size={44} />
        </div>
        <p className="font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
          Sube una foto de tu familia
        </p>
        <p className="text-sm" style={{ color: 'var(--color-bark-muted)' }}>
          Toca aquí para elegir de tu galería
        </p>
        <p className="text-xs mt-3" style={{ color: 'var(--color-sepia-300)' }}>
          JPG, PNG, WEBP o HEIC · Máximo {MAX_SIZE_MB} MB
        </p>
        <span className="btn btn-primary mt-6 pointer-events-none" style={{ fontSize: '1rem' }}>
          Elegir foto
        </span>
      </div>

      {error && (
        <div
          className="mt-4 p-4 rounded-lg text-sm"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--color-error)' }}
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  )
}

function ActionCard({
  selected, onClick, icon, title, description, badge,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
  badge: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left p-4 rounded-lg w-full"
      style={{
        border: `2px solid ${selected ? 'var(--color-amber)' : 'var(--color-sepia-100)'}`,
        background: selected ? 'var(--color-amber-50)' : 'var(--color-warm-white)',
        boxShadow: selected ? 'var(--shadow-amber)' : 'none',
        transition: 'border-color 120ms ease, background 120ms ease',
      }}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex-shrink-0"
          style={{ color: selected ? 'var(--color-amber)' : 'var(--color-sepia-300)' }}
        >
          {icon}
        </span>
        <div>
          <p className="font-semibold leading-tight mb-1" style={{ fontSize: '0.95rem' }}>{title}</p>
          <p className="text-xs leading-snug" style={{ color: 'var(--color-bark-muted)' }}>
            {description}
          </p>
          <span
            className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: selected ? 'var(--color-amber)' : 'var(--color-sepia-100)',
              color: selected ? '#fff' : 'var(--color-bark-muted)',
            }}
          >
            {badge}
          </span>
        </div>
      </div>
    </button>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
