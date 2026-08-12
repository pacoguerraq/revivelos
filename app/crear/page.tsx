import { PhotoUploader } from '@/components/ui/PhotoUploader'

export const metadata = {
  title: 'Sube tu foto — Revívelos',
}

export default function CrearPage() {
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
        <PhotoUploader />

        {/* Garantía de privacidad */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: 'var(--color-sepia-300)' }}
        >
          🔒 Tus fotos son privadas. Las eliminamos de nuestros servidores en 30 días.
        </p>
      </div>
    </div>
  )
}
