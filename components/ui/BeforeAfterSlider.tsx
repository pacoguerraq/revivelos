'use client'

import { useRef, useState, useCallback } from 'react'

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  beforeLabel?: string
  afterLabel?: string
  beforeFilter?: string
  afterFilter?: string
  aspectRatio?: string
  className?: string
}

function ImageFallback({ src }: { src: string }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2 text-center p-4"
      style={{ background: 'var(--color-sepia-100)' }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden
        style={{ color: 'var(--color-sepia-300)' }}>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
      <span
        className="font-mono leading-tight"
        style={{ fontSize: '0.65rem', color: 'var(--color-bark-muted)', wordBreak: 'break-all', maxWidth: '90%' }}
      >
        Imagen pendiente:{'\n'}{src}
      </span>
    </div>
  )
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Antes',
  afterLabel = 'Después',
  beforeFilter,
  afterFilter,
  aspectRatio = '4/3',
  className = '',
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const isDragging = useRef(false)
  const [beforeError, setBeforeError] = useState(false)
  const [afterError, setAfterError] = useState(false)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPosition((x / rect.width) * 100)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg select-none ${className}`}
      style={{ aspectRatio, touchAction: 'none', cursor: 'ew-resize' }}
      onPointerDown={(e) => {
        isDragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        updatePosition(e.clientX)
      }}
      onPointerMove={(e) => {
        if (!isDragging.current) return
        updatePosition(e.clientX)
      }}
      onPointerUp={() => { isDragging.current = false }}
      onPointerCancel={() => { isDragging.current = false }}
      role="img"
      aria-label={`Comparación: ${beforeLabel} a la izquierda, ${afterLabel} a la derecha`}
    >
      {/* Foto "después" — fondo completo */}
      {afterError ? (
        <div className="absolute inset-0">
          <ImageFallback src={afterSrc} />
        </div>
      ) : (
        <img
          src={afterSrc}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover"
          style={afterFilter ? { filter: afterFilter } : undefined}
          draggable={false}
          onError={() => setAfterError(true)}
        />
      )}

      {/* Foto "antes" — recortada al lado izquierdo */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {beforeError ? (
          <ImageFallback src={beforeSrc} />
        ) : (
          <img
            src={beforeSrc}
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-cover"
            style={beforeFilter ? { filter: beforeFilter } : undefined}
            draggable={false}
            onError={() => setBeforeError(true)}
          />
        )}
      </div>

      {/* Línea divisoria + handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white pointer-events-none"
        style={{ left: `${position}%`, boxShadow: '0 0 8px rgba(0,0,0,0.4)' }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-full flex items-center justify-center"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <path d="M8 5L3 11L8 17" stroke="#3D2B1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 5L19 11L14 17" stroke="#3D2B1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Etiquetas */}
      <span
        className="absolute top-3 left-3 pointer-events-none text-sm font-semibold px-2 py-1 rounded-sm text-white"
        style={{ background: 'rgba(61,43,31,0.72)', fontFamily: 'var(--font-sans)' }}
      >
        {beforeLabel}
      </span>
      <span
        className="absolute top-3 right-3 pointer-events-none text-sm font-semibold px-2 py-1 rounded-sm text-white"
        style={{ background: 'rgba(212,133,10,0.88)', fontFamily: 'var(--font-sans)' }}
      >
        {afterLabel}
      </span>
    </div>
  )
}
