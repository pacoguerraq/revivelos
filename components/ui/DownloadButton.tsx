'use client'

import { useState } from 'react'

export function DownloadButton({
  href,
  filename,
  label,
}: {
  href: string
  filename: string
  label: string
}) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleClick = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(href)
      if (!res.ok) throw new Error('No se pudo descargar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      // Si falla el fetch (red, CORS, etc.), se cae al comportamiento nativo
      // del navegador abriendo la URL directamente.
      window.location.href = href
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDownloading}
      className="btn btn-primary"
    >
      {isDownloading ? (
        <>
          <SpinnerIcon /> Descargando…
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
