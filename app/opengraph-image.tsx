import { renderShareImage } from '@/lib/og-image'

// Recomendación: imagen generada con next/og en vez de un /og.jpg estático.
// Compone las fotos reales de ejemplo (antes/después) en tiempo de build —
// como no depende de datos de request, Next.js la renderiza UNA sola vez y
// sirve el PNG resultante desde caché en cada request, así que el costo en
// tiempo real es el mismo que un archivo estático, pero sin tener que
// mantener un JPG diseñado a mano fuera del repo cada vez que cambien las
// fotos de ejemplo.
export const runtime = 'nodejs'
export const alt = 'Revívelos — foto de familia antes y después de restaurarla y colorearla con inteligencia artificial'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return renderShareImage(size)
}
