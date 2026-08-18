import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toApiJob, RETENTION_DAYS } from '@/lib/jobs'
import { DownloadButton } from '@/components/ui/DownloadButton'
import { GalleryThumbnail } from '@/components/ui/GalleryThumbnail'
import { FilmIcon } from '@/components/icons/FilmIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { CameraIcon } from '@/components/icons/CameraIcon'
import type { Job } from '@/lib/types'

const description = 'Tu galería de fotos restauradas y videos animados en Revívelos.'

export const metadata = {
  title: 'Mis fotos',
  description,
  robots: { index: false, follow: false },
  openGraph: { title: 'Mis fotos — Revívelos', description },
}

// 12 divide exacto entre los 3 breakpoints de la cuadrícula (2/3/4
// columnas) — la primera página nunca deja una fila a medias, y es chica
// a propósito para que la consulta y el streaming de la primera tanda de
// miniaturas sean rápidos.
const PAGE_SIZE = 12
// Filas visibles sin scroll en el breakpoint más angosto (grid-cols-2) —
// esas tarjetas cargan de inmediato; el resto usa loading="lazy" nativo.
const EAGER_COUNT = 4

interface Props {
  searchParams: Promise<{ cursor?: string }>
}

// Sin `async` a propósito: si esta función esperara `auth()` (una consulta
// real a la DB — sesión con `strategy: 'database'`) antes de devolver JSX,
// TODO lo que sigue —incluido el encabezado y el aviso de borrado, que no
// dependen de ningún dato— queda atrapado detrás del `loading.tsx` de esta
// ruta (mismo mecanismo que causaba el CLS de `Header` en el layout raíz,
// ver AGENTS.md "Rendimiento del landing"). `auth()` + la consulta de jobs
// se mueven a `Gallery`, el único componente async, envuelto en su propio
// `<Suspense>` — así el resto de la página se envía de inmediato.
export default function MisFotosPage({ searchParams }: Props) {
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

        <Suspense fallback={<GallerySkeleton />}>
          <Gallery searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

async function Gallery({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/entrar')
  const userId = session.user.id

  const { cursor: rawCursor } = await searchParams

  // Prisma ubica la fila del cursor por su id ÚNICO, sin aplicar el `where`
  // — así que un cursor con el id de un job ajeno igual "funciona" como
  // punto de partida (no expone los datos del otro job, el resultado sigue
  // filtrado por userId, pero sí deja usar un id arbitrario como oráculo de
  // existencia). Se valida la propiedad del cursor antes de usarlo.
  let cursor: string | undefined
  if (rawCursor) {
    const cursorJob = await prisma.job.findUnique({ where: { id: rawCursor }, select: { userId: true } })
    if (cursorJob?.userId === userId) cursor = rawCursor
  }

  const rawJobs = await prisma.job.findMany({
    where: { userId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = rawJobs.length > PAGE_SIZE
  const pageJobs = rawJobs.slice(0, PAGE_SIZE)
  const items = pageJobs.map(toApiJob)
  const nextCursor = hasMore ? pageJobs[pageJobs.length - 1].id : null

  const isEmpty = items.length === 0 && !cursor

  if (isEmpty) return <EmptyState />

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((job, i) => (
          <GalleryCard key={job.id} job={job} createdAt={pageJobs[i].createdAt} eager={i < EAGER_COUNT} />
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
  )
}

function GalleryCard({ job, createdAt, eager }: { job: Job; createdAt: Date; eager: boolean }) {
  const isVideo = job.type === 'animate'
  const expiresAt = new Date(createdAt.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const expiresLabel = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(expiresAt)
  const createdLabel = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(createdAt)

  return (
    <div
      className="card overflow-hidden flex flex-col"
      style={{ border: '1px solid var(--color-sepia-100)' }}
    >
      <div className="relative" style={{ aspectRatio: '1/1' }}>
        {job.thumbnailUrl && (
          <GalleryThumbnail
            src={job.thumbnailUrl}
            alt={isVideo ? 'Video animado — cuadro representativo' : 'Foto restaurada'}
            eager={eager}
          />
        )}
        {isVideo && (
          <>
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
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

// Mismas dimensiones exactas que GalleryCard: mismo grid, misma
// `aspectRatio: '1/1'` del área de imagen, mismo alto de texto/botón —
// para no introducir un salto de layout cuando la cuadrícula real la
// reemplaza.
function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" aria-hidden>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div
          key={i}
          className="card overflow-hidden flex flex-col"
          style={{ border: '1px solid var(--color-sepia-100)' }}
        >
          <div className="relative" style={{ aspectRatio: '1/1', background: 'var(--color-sepia-100)' }} />
          <div className="p-3 flex flex-col gap-2 flex-1">
            <div className="flex flex-col gap-1.5">
              <div className="rounded" style={{ width: '60%', height: 14, background: 'var(--color-sepia-100)' }} />
              <div className="rounded" style={{ width: '85%', height: 12, background: 'var(--color-sepia-100)' }} />
            </div>
            {/* 56px = min-height real de .btn (globals.css) */}
            <div className="rounded" style={{ height: 56, background: 'var(--color-sepia-100)' }} />
          </div>
        </div>
      ))}
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
