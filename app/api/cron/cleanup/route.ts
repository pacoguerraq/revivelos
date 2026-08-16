import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { storage } from '@/lib/storage'
import { RETENTION_DAYS } from '@/lib/jobs'

// Puede borrar muchos blobs uno por uno en una sola corrida — igual que el
// webhook de fal, necesita más que el default corto de Vercel.
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

  const jobs = await prisma.job.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, inputUrl: true, outputUrl: true, restoredUrl: true },
  })

  let blobsDeleted = 0
  let blobErrors = 0
  const jobIdsToDelete: string[] = []

  // Por job: solo se borra el registro de Job si TODOS sus blobs se
  // borraron sin error. Si uno falla, el job se queda para la corrida de
  // mañana (vuelve a intentar los blobs que ya se borraron — storage.delete
  // sobre un blob inexistente no debe tratarse como fatal) en vez de
  // arriesgarse a dejar un blob huérfano que ningún cron futuro vuelva a ver.
  for (const job of jobs) {
    const urls = [job.inputUrl, job.outputUrl, job.restoredUrl].filter(
      (url): url is string => Boolean(url),
    )

    let jobHadError = false
    for (const url of urls) {
      try {
        await storage.delete(url)
        blobsDeleted++
      } catch (error) {
        blobErrors++
        jobHadError = true
        console.error(`[cron/cleanup] no se pudo borrar el blob ${url} (job ${job.id})`, error)
      }
    }

    if (!jobHadError) jobIdsToDelete.push(job.id)
  }

  // CreditTransaction.jobId es onDelete: SetNull a propósito — el historial
  // financiero sobrevive al borrado del Job.
  let jobsDeleted = 0
  if (jobIdsToDelete.length > 0) {
    const result = await prisma.job.deleteMany({ where: { id: { in: jobIdsToDelete } } })
    jobsDeleted = result.count
  }

  console.log(
    `[cron/cleanup] jobs evaluados: ${jobs.length}, jobs borrados: ${jobsDeleted}, ` +
      `blobs borrados: ${blobsDeleted}, errores de blob: ${blobErrors}`,
  )

  return NextResponse.json({
    jobsEvaluados: jobs.length,
    jobsBorrados: jobsDeleted,
    blobsBorrados: blobsDeleted,
    erroresDeBlob: blobErrors,
  })
}
