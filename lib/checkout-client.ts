declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export interface CheckoutOutcome {
  ok: boolean
  needsAuth: boolean
  error?: string
}

// Lógica compartida entre el botón de PackageCard y la página /comprar/[id]
// (el destino al que se regresa tras iniciar sesión desde el flujo de
// compra) — un solo lugar que llama a /api/checkout y decide qué hacer con
// cada resultado posible.
export async function startCheckout(packageId: string): Promise<CheckoutOutcome> {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout')
  }

  let res: Response
  try {
    res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId }),
    })
  } catch {
    return { ok: false, needsAuth: false, error: 'No se pudo conectar. Revisa tu internet e intenta de nuevo.' }
  }

  if (res.status === 401) {
    return { ok: false, needsAuth: true }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    return { ok: false, needsAuth: false, error: data?.error ?? 'No se pudo iniciar el pago. Intenta de nuevo.' }
  }

  const data = (await res.json()) as { url?: string }
  if (!data.url) {
    return { ok: false, needsAuth: false, error: 'No se pudo iniciar el pago. Intenta de nuevo.' }
  }

  window.location.href = data.url
  return { ok: true, needsAuth: false }
}
