// Helpers tipados para disparar eventos estándar de Meta Pixel desde
// cualquier client component. Cada uno es un guard sobre window.fbq —
// si el script todavía no cargó (bloqueador de anuncios, primeros ms de
// hidratación) la llamada simplemente no hace nada, nunca lanza.
//
// El evento Purchase real de este proyecto se dispara server-side por
// Conversions API (lib/meta-capi.ts, desde el webhook de Stripe) porque
// es la fuente de verdad del pago y no depende de que el navegador siga
// abierto. trackPurchase() de aquí solo existe por si en el futuro se
// quiere un evento de navegador complementario para el pixel de
// aprendizaje — de usarse, su eventId debe coincidir con el que genera
// sendPurchaseCapiEvent para que Meta deduplique en vez de contar la
// compra dos veces.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

function fbq(...args: unknown[]): void {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq(...args)
}

// Llamar cuando el usuario ve el resultado de su restauración/animación
// (ej. app/resultado/[jobId]/page.tsx, desde un client component).
export function trackViewContent(): void {
  fbq('track', 'ViewContent')
}

// Llamar al iniciar el checkout de un paquete de créditos.
// Ya integrado en lib/checkout-client.ts → startCheckout().
export function trackInitiateCheckout(): void {
  fbq('track', 'InitiateCheckout')
}

// Llamar solo si se decide agregar un evento Purchase de navegador
// complementario al de CAPI — ver nota arriba. currency en formato ISO
// (ej. 'MXN').
export function trackPurchase(value: number, currency: string): void {
  fbq('track', 'Purchase', { value, currency })
}
