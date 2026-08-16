import { renderShareImage } from '@/lib/og-image'

// Misma composición que Open Graph. Se declara por separado (no se
// re-exporta desde ./opengraph-image) porque los archivos de convención
// especial de Next.js no se pueden importar entre sí de forma confiable en
// dev — ver la nota en lib/og-image.tsx.
export const runtime = 'nodejs'
export const alt = 'Revívelos — foto de familia antes y después de restaurarla y colorearla con inteligencia artificial'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return renderShareImage(size)
}
