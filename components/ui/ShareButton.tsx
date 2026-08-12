'use client'

export function ShareButton() {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Mi foto restaurada con Revívelos',
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('¡Enlace copiado!')
    }
  }

  return (
    <button type="button" onClick={handleShare} className="btn btn-ghost">
      Compartir resultado
    </button>
  )
}
