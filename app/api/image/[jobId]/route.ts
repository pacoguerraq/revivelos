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
  const variant = v === 'output' ? 'output' : v === 'poster' ? 'poster' : 'input'
  const blobUrl = variant === 'output' ? job.outputUrl : variant === 'poster' ? job.restoredUrl : job.inputUrl

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
    'Cache-Control': 'private, max-age=3600',
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
