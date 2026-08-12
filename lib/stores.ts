import type { Job, StoredImage, CreditBalance } from './types'

// In-memory singletons — se resetean al reiniciar el servidor.
// TODO: Reemplazar con Redis para persistencia en producción.
const jobsMap = new Map<string, Job>()
const imagesMap = new Map<string, StoredImage>()
const creditsMap = new Map<string, CreditBalance>()

export const jobsStore = {
  get: (id: string) => jobsMap.get(id),

  set: (id: string, job: Job) => { jobsMap.set(id, job) },

  update: (id: string, updates: Partial<Omit<Job, 'id' | 'createdAt'>>) => {
    const job = jobsMap.get(id)
    if (!job) return null
    const updated: Job = { ...job, ...updates, updatedAt: new Date().toISOString() }
    jobsMap.set(id, updated)
    return updated
  },
}

export const imagesStore = {
  get: (id: string) => imagesMap.get(id),
  set: (id: string, image: StoredImage) => { imagesMap.set(id, image) },
}

export const creditsStore = {
  get: (userId: string): CreditBalance =>
    creditsMap.get(userId) ?? { credits: 0, freeUsed: false },

  useFree: (userId: string) => {
    const current = creditsStore.get(userId)
    creditsMap.set(userId, { ...current, freeUsed: true })
  },

  deduct: (userId: string, amount: number): boolean => {
    const current = creditsStore.get(userId)
    if (current.credits < amount) return false
    creditsMap.set(userId, { ...current, credits: current.credits - amount })
    return true
  },

  add: (userId: string, amount: number) => {
    const current = creditsStore.get(userId)
    creditsMap.set(userId, { ...current, credits: current.credits + amount })
  },
}
