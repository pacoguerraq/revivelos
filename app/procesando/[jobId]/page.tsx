import { notFound } from 'next/navigation'
import { getJobForUser, toApiJob } from '@/lib/jobs'
import { getUserId } from '@/lib/cookies'
import { ProgressStages } from '@/components/ui/ProgressStages'

export const metadata = {
  title: 'Procesando tu foto — Revívelos',
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
            Tarda menos de un minuto. No cierres esta pantalla.
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
