export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type JobType = 'restore' | 'animate'
export type JobStage = 'restoring' | 'animating' | 'done'

export interface Job {
  id: string
  status: JobStatus
  type: JobType
  stage: JobStage
  inputUrl: string
  outputUrl: string | null
  // Solo se llena para jobs 'animate' completos — reutiliza la restauración
  // intermedia como cuadro representativo del video antes de que cargue.
  posterUrl: string | null
  // Miniatura ligera para la cuadrícula de /mis-fotos — nunca null para un
  // job completado: si no hay Job.thumbnailUrl en la DB (jobs previos a este
  // campo), /api/image/[jobId]?v=thumb cae al original server-side.
  thumbnailUrl: string | null
  watermarked: boolean
  error: string | null
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreditBalance {
  credits: number
  freeUsed: boolean
}

// Tipos de paquetes y costos viven en lib/pricing.ts
