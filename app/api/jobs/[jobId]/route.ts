import { type NextRequest, NextResponse } from 'next/server'
import { jobsStore } from '@/lib/stores'
import { getUserId } from '@/lib/cookies'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  const userId = await getUserId()

  const job = jobsStore.get(jobId)

  if (!job) {
    return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })
  }

  if (job.userId !== userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  return NextResponse.json(job)
}
