'use client'

import { useState } from 'react'

const SHARE_TEXT = 'Mira lo que hice en revivelos.com'

export function ShareButton({
  href,
  filename,
  mimeType,
}: {
  href: string
  filename: string
  mimeType: string
}) {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const res = await fetch(href)
      if (!res.ok) throw new Error('No se pudo obtener el archivo')
      const blob = await res.blob()
      const file = new File([blob], filename, { type: mimeType })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: SHARE_TEXT, files: [file] })
        return
      }

      if (navigator.share) {
        await navigator.share({ text: SHARE_TEXT, url: window.location.href })
        return
      }

      await navigator.clipboard.writeText(`${SHARE_TEXT}\n${window.location.href}`)
      alert('¡Enlace copiado!')
    } catch (err) {
      // AbortError: el usuario cerró el cuadro de compartir sin elegir nada — no es un error real.
      if (err instanceof Error && err.name === 'AbortError') return

      try {
        await navigator.clipboard.writeText(`${SHARE_TEXT}\n${window.location.href}`)
        alert('¡Enlace copiado!')
      } catch {
        window.location.href = href
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <button type="button" onClick={handleShare} disabled={isSharing} className="btn btn-ghost">
      {isSharing ? 'Preparando…' : 'Compartir resultado'}
    </button>
  )
}
