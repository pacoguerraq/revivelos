import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toApiJob } from '@/lib/jobs'
import { DownloadButton } from '@/components/ui/DownloadButton'
import { FilmIcon } from '@/components/icons/FilmIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { CameraIcon } from '@/components/icons/CameraIcon'
import type { Job } from '@/lib/types'

export const metadata = {
  title: 'Mis fotos — Revívelos',
}

const PAGE_SIZE = 20
const RETENTION_DAYS = 30

interface Props {
  searchParams: Promise<{ cursor?: string }>
}

export default async function MisFotosPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/entrar')

  const { cursor } = await searchParams

  const rawJobs = await prisma.job.findMany({
    where: { userId: session.user.id, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = rawJobs.length > PAGE_SIZE
  const pageJobs = rawJobs.slice(0, PAGE_SIZE)
  const items = pageJobs.map(toApiJob)
  const nextCursor = hasMore ? pageJobs[pageJobs.length - 1].id : null

  const isEmpty = items.length === 0 && !cursor

  return (
    <div className="py-12 sm:py-16">
      <div className="section-wrap">
        <div className="mb-8">
          <h1
            className="font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2rem)' }}
          >
            Mis fotos
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-bark-muted)' }}>
            Guardamos tus fotos y videos {RETENTION_DAYS} días desde que se crean. Descárgalos antes de que se borren.
          </p>
        </div>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((job, i) => (
                <GalleryCard key={job.id} job={job} createdAt={pageJobs[i].createdAt} />
              ))}
            </div>

            {nextCursor && (
              <div className="flex justify-center mt-8">
                <Link href={`/mis-fotos?cursor=${nextCursor}`} className="btn btn-secondary">
                  Ver más
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function GalleryCard({ job, createdAt }: { job: Job; createdAt: Date }) {
  const isVideo = job.type === 'animate'
  const expiresAt = new Date(createdAt.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const expiresLabel = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(expiresAt)
  const createdLabel = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(createdAt)

  return (
    <div
      className="card overflow-hidden flex flex-col"
      style={{ border: '1px solid var(--color-sepia-100)' }}
    >
      <div className="relative" style={{ aspectRatio: '1/1', background: '#000' }}>
        {isVideo ? (
          <>
            <video
              src={job.outputUrl ?? undefined}
              muted
              playsInline
              preload="metadata"
              className="w-full h-full"
              style={{ objectFit: 'cover' }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.15)' }}
            >
              <div
                className="rounded-full flex items-center justify-center"
                style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.9)', color: 'var(--color-bark)' }}
              >
                <PlayIcon size={22} />
              </div>
            </div>
            <span
              className="absolute top-2 left-2 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: 'rgba(61,43,31,0.7)', color: '#fff' }}
            >
              <FilmIcon size={12} /> Video
            </span>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- imagen dinámica servida por proxy autenticado
          <img
            src={job.outputUrl ?? undefined}
            alt="Foto restaurada"
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-bark)' }}>
            {isVideo ? 'Video animado' : 'Foto restaurada'}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-bark-muted)' }}>
            {createdLabel} · se borra el {expiresLabel}
          </p>
        </div>
        {job.outputUrl && (
          <DownloadButton
            href={job.outputUrl}
            filename={`revivelos-${job.id}.${isVideo ? 'mp4' : 'jpg'}`}
            label="Descargar"
          />
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="mb-4 flex justify-center" style={{ color: 'var(--color-sepia-300)' }}>
        <CameraIcon size={44} />
      </div>
      <h2
        className="font-bold mb-3"
        style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}
      >
        Todavía no tienes fotos aquí
      </h2>
      <p className="mb-8" style={{ color: 'var(--color-bark-muted)' }}>
        Cuando restaures o animes una foto, la vas a encontrar en esta galería.
      </p>
      <Link href="/crear" className="btn btn-primary">
        Revive una foto
      </Link>
    </div>
  )
}
