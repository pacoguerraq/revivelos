'use client'

import { useRef, useState } from 'react'

interface VideoPlayerProps {
  src: string
  posterUrl: string | null
}

// El <video> apunta directo a /api/image/[jobId]?v=output (el mismo proxy
// autenticado de siempre, ahora con soporte de Range requests — ver
// AGENTS.md, "Entrega de video"): el navegador puede pedir el archivo por
// partes y empezar a reproducir sin esperar la descarga completa. `poster`
// muestra algo de inmediato (la restauración ya lista) mientras el video
// carga su primer cuadro.
export function VideoPlayer({ src, posterUrl }: VideoPlayerProps) {
  const [buffering, setBuffering] = useState(true)
  const [errored, setErrored] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleRetry = () => {
    setErrored(false)
    setBuffering(true)
    videoRef.current?.load()
  }

  return (
    <div className="relative w-full flex justify-center" style={{ minHeight: 240 }}>
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl ?? undefined}
        autoPlay
        loop
        muted
        playsInline
        controls
        preload="metadata"
        className="max-w-full"
        style={{ maxHeight: '75vh', height: 'auto', width: 'auto' }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onError={() => {
          setBuffering(false)
          setErrored(true)
        }}
      />

      {/* Estado de carga visible mientras no hay cuadro que mostrar — nunca
          un rectángulo negro sin explicación. */}
      {!errored && buffering && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{
            background: posterUrl ? 'rgba(0,0,0,0.35)' : 'var(--color-sepia-100)',
            color: posterUrl ? '#fff' : 'var(--color-bark-muted)',
          }}
        >
          <svg
            className="animate-spin"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Cargando video"
            role="status"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-semibold">Cargando tu video…</span>
        </div>
      )}

      {errored && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6"
          style={{ background: 'var(--color-sepia-100)', color: 'var(--color-bark-muted)' }}
        >
          <span className="text-sm font-semibold">No pudimos cargar el video.</span>
          <button
            type="button"
            onClick={handleRetry}
            className="btn btn-secondary"
            style={{ minHeight: 40, padding: '0 16px', fontSize: '0.875rem' }}
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}
