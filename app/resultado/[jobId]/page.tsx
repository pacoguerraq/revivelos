import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getJobForUser, toApiJob } from '@/lib/jobs'
import { getUserId } from '@/lib/cookies'
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider'
import { ShareButton } from '@/components/ui/ShareButton'
import { DownloadButton } from '@/components/ui/DownloadButton'
import { VideoPlayer } from '@/components/ui/VideoPlayer'

const description = 'El resultado de tu restauración o animación con Revívelos.'

export const metadata = {
  title: 'Tu foto restaurada',
  description,
  robots: { index: false, follow: false },
  openGraph: { title: 'Tu foto restaurada — Revívelos', description },
}

interface Props {
  params: Promise<{ jobId: string }>
}

export default async function ResultadoPage({ params }: Props) {
  const { jobId } = await params
  const userId = await getUserId()

  const rawJob = await getJobForUser(jobId, userId)

  if (!rawJob) {
    notFound()
  }

  const job = toApiJob(rawJob)

  if (job.status === 'failed') {
    return <ErrorView />
  }

  const isVideo = job.type === 'animate'

  if (job.status !== 'completed' || !job.outputUrl) {
    return <StillProcessingView jobId={jobId} />
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="section-wrap" style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Encabezado de éxito */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4" aria-hidden>🎉</div>
          <h1
            className="font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}
          >
            {job.type === 'restore' ? '¡Tu foto quedó hermosa!' : '¡Tu video está listo!'}
          </h1>
          <p style={{ color: 'var(--color-bark-muted)' }}>
            {job.watermarked
              ? 'Esta es una vista previa gratuita, en baja resolución.'
              : 'Aquí está tu resultado en alta calidad.'}
          </p>
        </div>

        {/* Resultado: video animado o slider antes/después. Ninguno de los
            dos fuerza un recorte a 4/3 — es la foto o el video real del
            usuario, con la proporción que haya subido, no una foto de
            stock curada como en el Hero/Ejemplos. */}
        <div
          className="rounded-xl overflow-hidden mb-6 flex justify-center"
          style={{ boxShadow: 'var(--shadow-warm-lg)', border: '1px solid var(--color-sepia-100)', background: '#000' }}
        >
          {isVideo && job.outputUrl ? (
            <VideoPlayer src={job.outputUrl} posterUrl={job.posterUrl} />
          ) : (
            <BeforeAfterSlider
              beforeSrc={job.inputUrl}
              afterSrc={job.outputUrl}
              beforeLabel="Original"
              afterLabel="Restaurada"
              beforeAlt="Tu foto original, antes de restaurarla"
              afterAlt="Tu foto ya restaurada"
              beforeFilter="grayscale(85%) contrast(0.9)"
              afterFilter="sepia(20%) saturate(1.3) brightness(1.05) contrast(1.05)"
              aspectRatio="4/3"
              objectFit="contain"
              className="w-full"
              unoptimized
            />
          )}
        </div>

        {/* Marca de agua notice */}
        {job.watermarked && (
          <div
            className="card p-5 mb-6 text-center"
            style={{ border: '1px solid var(--color-sepia-200)', background: 'var(--color-amber-50)' }}
          >
            <p className="font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Vista previa gratuita
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-bark-muted)' }}>
              Esta foto de prueba tiene marca de agua y resolución reducida. Para la versión en alta
              calidad, sin marca de agua y lista para imprimir, vuelve a subirla — se cobra 1 crédito.
            </p>
            <Link href="/crear" className="btn btn-primary" style={{ fontSize: '1rem' }}>
              Restaurar en alta calidad
            </Link>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!job.watermarked && job.outputUrl && (
            <DownloadButton
              href={job.outputUrl}
              filename={`revivelos-${jobId}.${isVideo ? 'mp4' : 'jpg'}`}
              mimeType={isVideo ? 'video/mp4' : 'image/jpeg'}
              kind={isVideo ? 'video' : 'foto'}
            />
          )}
          <Link href="/crear" className="btn btn-secondary">
            Restaurar otra foto
          </Link>
          {job.outputUrl && (
            <ShareButton
              href={job.outputUrl}
              filename={`revivelos-${jobId}.${isVideo ? 'mp4' : 'jpg'}`}
              mimeType={isVideo ? 'video/mp4' : 'image/jpeg'}
            />
          )}
        </div>

        {/* Prueba social / nudge */}
        <p
          className="text-center text-sm mt-10"
          style={{ color: 'var(--color-bark-muted)' }}
        >
          ¿Te gustó el resultado? Cuéntale a tu familia.{' '}
          <Link href="/crear" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
            Restaura otra foto gratis →
          </Link>
        </p>
      </div>
    </div>
  )
}

function ErrorView() {
  return (
    <div className="py-20 text-center">
      <div className="section-wrap" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="text-5xl mb-4">😔</div>
        <h1
          className="font-bold mb-3"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}
        >
          Algo salió mal
        </h1>
        <p className="mb-8" style={{ color: 'var(--color-bark-muted)' }}>
          Ocurrió un error al procesar tu foto. Lo sentimos mucho. Ya te devolvimos el crédito, no se te cobró nada.
        </p>
        <Link href="/crear" className="btn btn-primary">
          Intentar de nuevo
        </Link>
      </div>
    </div>
  )
}

function StillProcessingView({ jobId }: { jobId: string }) {
  return (
    <div className="py-20 text-center">
      <div className="section-wrap" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="text-5xl mb-4">⏳</div>
        <h1
          className="font-bold mb-3"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}
        >
          Todavía estamos trabajando
        </h1>
        <p className="mb-8" style={{ color: 'var(--color-bark-muted)' }}>
          Tu foto aún se está procesando. En unos segundos estará lista.
        </p>
        <Link href={`/procesando/${jobId}`} className="btn btn-primary">
          Ver progreso
        </Link>
      </div>
    </div>
  )
}
