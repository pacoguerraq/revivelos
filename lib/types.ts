export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type JobType = 'restore' | 'animate'

export interface Job {
  id: string
  status: JobStatus
  type: JobType
  inputUrl: string
  outputUrl: string | null
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

export interface StoredImage {
  buffer: Uint8Array
  mimeType: string
  originalName: string
}

// Tipos de paquetes y costos viven en lib/pricing.ts
