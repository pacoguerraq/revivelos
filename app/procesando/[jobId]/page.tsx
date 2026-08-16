import { notFound } from 'next/navigation'
import { getJobForUser, toApiJob } from '@/lib/jobs'
import { getUserId } from '@/lib/cookies'
import { ProgressStages } from '@/components/ui/ProgressStages'

const description = 'Tu foto se está restaurando o animando. Esto toma solo un momento.'

export const metadata = {
  title: 'Procesando tu foto',
  description,
  robots: { index: false, follow: false },
  openGraph: { title: 'Procesando tu foto — Revívelos', description },
}

interface Props {
  params: Promise<{ jobId: string }>
}

export default async function ProcesandoPage({ params }: Props) {
  const { jobId } = await params
  const userId = await getUserId()

  const rawJob = await getJobForUser(jobId, userId)

  if (!rawJob) {
    notFound()
  }

  const job = toApiJob(rawJob)
  const typeLabel = job.type === 'restore' ? 'Restaurando y colorizando' : 'Animando'
  const waitMessage = job.type === 'restore'
    ? 'Toma solo un momento. No cierres esta pantalla.'
    : 'Los videos tardan varios minutos. No cierres esta pantalla — puedes volver más tarde y seguirá procesándose.'

  return (
    <div className="py-16 sm:py-24">
      <div className="section-wrap" style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1
            className="font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2rem)' }}
          >
            {typeLabel} tu foto…
          </h1>
          <p style={{ color: 'var(--color-bark-muted)' }}>
            {waitMessage}
          </p>
        </div>

        {/* Etapas con polling */}
        <ProgressStages jobId={jobId} type={job.type} />

        {/* Aviso de privacidad */}
        <p
          className="text-center text-xs mt-12"
          style={{ color: 'var(--color-sepia-300)' }}
        >
          🔒 Tu foto nunca se comparte con nadie.
        </p>
      </div>
    </div>
  )
}
