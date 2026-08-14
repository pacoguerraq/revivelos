import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/cookies'
import { getJobForUser, toApiJob } from '@/lib/jobs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  const userId = await getUserId()

  const job = await getJobForUser(jobId, userId)

  if (!job) {
    return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })
  }

  return NextResponse.json(toApiJob(job))
}
