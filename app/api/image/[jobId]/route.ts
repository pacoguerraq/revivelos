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

  const variant = request.nextUrl.searchParams.get('v') === 'output' ? 'output' : 'input'
  const blobUrl = variant === 'output' ? job.outputUrl : job.inputUrl

  if (!blobUrl) {
    return new NextResponse('Imagen no encontrada', { status: 404 })
  }

  const blobResponse = await fetch(blobUrl)
  if (!blobResponse.ok) {
    return new NextResponse('No se pudo obtener la imagen', { status: 502 })
  }

  const buffer = new Uint8Array(await blobResponse.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': blobResponse.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
