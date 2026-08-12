import { type NextRequest, NextResponse } from 'next/server'
import { imagesStore } from '@/lib/stores'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  const image = imagesStore.get(jobId)

  if (!image) {
    return new NextResponse('Imagen no encontrada', { status: 404 })
  }

  return new NextResponse(new Uint8Array(image.buffer), {
    headers: {
      'Content-Type': image.mimeType,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
