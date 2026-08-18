import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/cookies'
import { getJobForUser } from '@/lib/jobs'
import { enforceGeneralRateLimit } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const limited = await enforceGeneralRateLimit(request)
  if (limited) return limited

  const { jobId } = await params
  const userId = await getUserId()

  const job = await getJobForUser(jobId, userId)
  if (!job) {
    return new NextResponse('Imagen no encontrada', { status: 404 })
  }

  const v = request.nextUrl.searchParams.get('v')
  // 'poster' reutiliza la restauración intermedia (job.restoredUrl) como
  // cuadro representativo del video en jobs ANIMATE — no se genera ni
  // guarda ninguna imagen nueva para esto.
  const variant = v === 'output' ? 'output' : v === 'poster' ? 'poster' : v === 'thumb' ? 'thumb' : 'input'

  let blobUrl: string | null
  if (variant === 'output') blobUrl = job.outputUrl
  else if (variant === 'poster') blobUrl = job.restoredUrl
  else if (variant === 'thumb') {
    // Fallback para jobs creados antes de Job.thumbnailUrl (ver
    // AGENTS.md, "Miniaturas de /mis-fotos"): sirve el original en su
    // lugar — más pesado, pero sigue funcionando sin backfill. Para video
    // el "original" aquí es la restauración (restoredUrl), nunca el video.
    blobUrl = job.thumbnailUrl ?? (job.type === 'ANIMATE' ? job.restoredUrl : job.outputUrl)
  } else blobUrl = job.inputUrl

  if (!blobUrl) {
    return new NextResponse('Imagen no encontrada', { status: 404 })
  }

  // Reenvía el header Range al Blob — sin esto, un cliente que pida un
  // rango (video parcial, o un navegador reintentando una descarga
  // interrumpida) se ve forzado a esperar el archivo completo. El video
  // final ya no pasa por aquí (ver GET /api/video/[jobId]), pero esta ruta
  // sigue sirviendo imágenes de hasta 15MB y es la que usa DownloadButton.
  const rangeHeader = request.headers.get('range')
  const blobResponse = await fetch(blobUrl, {
    headers: rangeHeader ? { Range: rangeHeader } : undefined,
  })
  if (!blobResponse.ok && blobResponse.status !== 206) {
    return new NextResponse('No se pudo obtener la imagen', { status: 502 })
  }
  if (!blobResponse.body) {
    return new NextResponse('No se pudo obtener la imagen', { status: 502 })
  }

  const headers: Record<string, string> = {
    'Content-Type': blobResponse.headers.get('content-type') ?? 'image/jpeg',
    // `private`, nunca `public` — esta ruta valida dueño en cada request
    // (arriba), así que una caché compartida (CDN/proxy) no debe guardar la
    // respuesta y servírsela a otro usuario. `immutable` + un max-age largo
    // sí son seguros: el contenido en (jobId, variant) no se sobreescribe
    // una vez escrito (salvo el backfill retroactivo de thumbnailUrl, ver
    // AGENTS.md — el navegador puede quedarse con el fallback grande un
    // rato tras un backfill, no es un problema de corrección).
    'Cache-Control': 'private, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  }
  const contentRange = blobResponse.headers.get('content-range')
  if (contentRange) headers['Content-Range'] = contentRange
  const contentLength = blobResponse.headers.get('content-length')
  if (contentLength) headers['Content-Length'] = contentLength

  // Se reenvía el stream tal cual, sin bufferear el archivo entero en
  // memoria — más rápido y usa menos memoria de la función serverless que
  // convertir a Uint8Array primero.
  return new NextResponse(blobResponse.body, {
    status: rangeHeader && blobResponse.status === 206 ? 206 : 200,
    headers,
  })
}
