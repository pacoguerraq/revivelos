import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL no está definida. Agrega la cadena de conexión de Postgres a .env.local antes de arrancar.',
  )
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
