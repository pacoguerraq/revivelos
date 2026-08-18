'use client'

import { useEffect, useState } from 'react'

function isMobileDevice(): boolean {
  const uaData = (navigator as Navigator & { userAgentData?: { mobile: boolean } }).userAgentData
  if (uaData) return uaData.mobile
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function DownloadButton({
  href,
  filename,
  mimeType,
  kind,
}: {
  href: string
  filename: string
  mimeType: string
  kind: 'foto' | 'video'
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  // 'Descargar' es el default seguro para SSR (sin navigator); se corrige a
  // 'Guardar' tras montar si el dispositivo es móvil, para no desincronizar
  // el HTML del servidor con el del cliente en la hidratación.
  const [actionWord, setActionWord] = useState<'Descargar' | 'Guardar'>('Descargar')

  useEffect(() => {
    if (isMobileDevice()) setActionWord('Guardar')
  }, [])

  const handleClick = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(href)
      if (!res.ok) throw new Error('No se pudo descargar')
      const blob = await res.blob()

      // En celular, un <a download> típicamente cae en la carpeta de
      // Descargas/Archivos, no en el carrete de fotos. La forma real de
      // llegar a la galería es el cuadro nativo para compartir/guardar
      // (en iOS y Android trae la opción "Guardar imagen/video"), así que
      // ahí se usa en vez de la descarga silenciosa.
      if (isMobileDevice()) {
        const file = new File([blob], filename, { type: mimeType })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] })
          return
        }
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      // Si falla el fetch (red, CORS, etc.), se cae al comportamiento nativo
      // del navegador abriendo la URL directamente.
      window.location.href = href
    } finally {
      setIsDownloading(false)
    }
  }

  const label = isDownloading ? 'Preparando…' : `${actionWord} ${kind}`

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDownloading}
      className="btn btn-primary"
    >
      {isDownloading ? (
        <>
          <SpinnerIcon /> {label}
        </>
      ) : (
        <>⬇ {label}</>
      )}
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
