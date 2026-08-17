import { PhotoUploader } from '@/components/ui/PhotoUploader'
import { LockIcon } from '@/components/icons/LockIcon'
import { getUserId } from '@/lib/cookies'
import { getBalance } from '@/lib/credits'

const description =
  'Sube una foto antigua de tu familia y elige si quieres restaurarla y colorearla, o convertirla en un video animado. La primera restauración es gratis.'

export const metadata = {
  title: 'Sube tu foto',
  description,
  alternates: { canonical: '/crear' },
  openGraph: { title: 'Sube tu foto — Revívelos', description },
}

export default async function CrearPage() {
  const userId = await getUserId()
  const balance = await getBalance(userId)

  return (
    <div className="py-12 sm:py-20">
      <div className="section-wrap" style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Encabezado */}
        <div className="text-center mb-10">
          <h1
            className="font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}
          >
            Sube tu foto familiar
          </h1>
          <p style={{ color: 'var(--color-bark-muted)', maxWidth: 420, margin: '0 auto' }}>
            La primera restauración es gratis. No necesitas crear una cuenta ni dar ningún dato.
          </p>
        </div>

        {/* Zona de carga */}
        <PhotoUploader hasCredits={balance.credits > 0} />

        {/* Garantía de privacidad */}
        <p
          className="text-center text-xs mt-8 flex items-center justify-center gap-1.5"
          style={{ color: 'var(--color-sepia-300)' }}
        >
          <LockIcon size={13} />
          Tus fotos son privadas. Las eliminamos de nuestros servidores en 30 días.
        </p>

        {/* Aviso de IA — visible en el sitio, no solo en los términos */}
        <p
          className="text-center text-xs mt-2"
          style={{ color: 'var(--color-sepia-300)', maxWidth: 440, margin: '0.5rem auto 0' }}
        >
          El resultado lo genera un modelo de inteligencia artificial: puede variar entre intentos y, en
          zonas muy dañadas, reconstruye detalles que quizá no correspondan exactamente a la foto original.
        </p>
      </div>
    </div>
  )
}
