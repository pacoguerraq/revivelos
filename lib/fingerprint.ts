// Huella de dispositivo del lado del cliente: segunda capa antiabuso del
// free tier, además de la cookie httpOnly. No depende de la red (persiste
// aunque cambie de wifi/datos) y sobrevive a incógnito/borrar cookies del
// mismo navegador. No sobrevive a un navegador distinto en el mismo equipo
// — ninguna huella de cliente lo hace sin invadir la privacidad del usuario.
function canvasSignal(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('revivelos-fp', 2, 2)
    return canvas.toDataURL()
  } catch {
    return ''
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      String(navigator.hardwareConcurrency ?? ''),
      String(screen.width),
      String(screen.height),
      String(screen.colorDepth),
      String(new Date().getTimezoneOffset()),
      canvasSignal(),
    ]
    const raw = parts.join('|')
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    // Si algo falla (navegador viejo, extensión de privacidad, etc.) se
    // envía vacío y el servidor cae de vuelta a solo la cookie.
    return ''
  }
}
