'use client'

import { useState } from 'react'

interface GalleryThumbnailProps {
  src: string
  alt: string
  // Filas iniciales, visibles sin scroll — cargan de inmediato en vez de
  // esperar a que el navegador decida que están cerca del viewport.
  eager?: boolean
}

// Carga progresiva por tarjeta: cada miniatura resuelve por su cuenta
// (spinner discreto → fade-in), sin bloquear a las demás ni a la cuadrícula.
// Sin porcentaje de progreso — no hay forma confiable de medirlo para una
// sola imagen, y un porcentaje atorado se siente peor que un spinner.
//
// Sin alto fijo ni object-fit: cover a propósito: la miniatura se muestra a
// su proporción real (vertical, cuadrada o panorámica), sin recortarla. Un
// alto mínimo solo mientras carga o falla evita que la celda colapse a 0px
// antes de conocer el tamaño real de la imagen.
export function GalleryThumbnail({ src, alt, eager = false }: GalleryThumbnailProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')

  return (
    <div
      className="relative w-full"
      style={{ background: 'var(--color-sepia-100)', minHeight: state === 'loaded' ? undefined : 140 }}
    >
      {state !== 'error' && (
        // eslint-disable-next-line @next/next/no-img-element -- imagen dinámica servida por proxy autenticado
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full block"
          style={{
            height: 'auto',
            opacity: state === 'loaded' ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}

      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <svg
            className="animate-spin"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: 'var(--color-sepia-300)' }}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {state === 'error' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center px-2"
          style={{ color: 'var(--color-bark-muted)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
            <path d="M3 3l18 18" />
          </svg>
          <span className="text-xs">No se pudo cargar</span>
        </div>
      )}
    </div>
  )
}
