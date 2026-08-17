import { prisma } from './db'
import { PACKAGES, API_COST_MXN } from './pricing'
import { FREE_TIER_DAILY_CAP, FREE_TIER_ENABLED, startOfTodayUTC } from './jobs'

export { FREE_TIER_DAILY_CAP, FREE_TIER_ENABLED }

function packageForCredits(credits: number) {
  return PACKAGES.find((p) => p.credits === credits) ?? null
}

export interface DaySummary {
  freeUsed: number
  paidRestore: number
  paidAnimate: number
  failed: number
  purchaseCount: number
  revenueMxn: number
  costMxn: number
  newUsers: number
}

// Todos los conteos de jobs son sobre `createdAt` (se crean al momento de
// aceptar el intento, no al completarse) y no filtran por status: un job
// FAILED también consumió (o probablemente consumió) llamada a fal, así que
// cuenta igual para el costo estimado — ver AGENTS.md "El número que decide
// la campaña".
async function getDaySummary(start: Date, end: Date): Promise<DaySummary> {
  const [freeUsed, paidRestore, paidAnimate, failed, purchases, newUsers] = await Promise.all([
    prisma.job.count({ where: { tier: 'FREE', createdAt: { gte: start, lt: end } } }),
    prisma.job.count({ where: { tier: 'PAID', type: 'RESTORE', createdAt: { gte: start, lt: end } } }),
    prisma.job.count({ where: { tier: 'PAID', type: 'ANIMATE', createdAt: { gte: start, lt: end } } }),
    prisma.job.count({ where: { status: 'FAILED', createdAt: { gte: start, lt: end } } }),
    prisma.creditTransaction.findMany({
      where: { reason: 'PURCHASE', externalId: { not: null }, createdAt: { gte: start, lt: end } },
      select: { delta: true },
    }),
    prisma.user.count({ where: { isAnonymous: false, createdAt: { gte: start, lt: end } } }),
  ])

  const revenueMxn = purchases.reduce((sum, p) => sum + (packageForCredits(p.delta)?.price ?? 0), 0)
  const costMxn =
    freeUsed * API_COST_MXN.restoreFree + paidRestore * API_COST_MXN.restorePaid + paidAnimate * API_COST_MXN.animate

  return { freeUsed, paidRestore, paidAnimate, failed, purchaseCount: purchases.length, revenueMxn, costMxn, newUsers }
}

export interface TodayYesterday {
  today: DaySummary
  yesterday: DaySummary
  failedToday: { id: string; type: string; error: string | null; createdAt: Date }[]
}

export async function getTodayYesterdaySummary(): Promise<TodayYesterday> {
  const startOfToday = startOfTodayUTC()
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

  const [today, yesterday, failedToday] = await Promise.all([
    getDaySummary(startOfToday, startOfTomorrow),
    getDaySummary(startOfYesterday, startOfToday),
    prisma.job.findMany({
      where: { status: 'FAILED', createdAt: { gte: startOfToday, lt: startOfTomorrow } },
      select: { id: true, type: true, error: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return { today, yesterday, failedToday }
}

export interface DaySeriesPoint {
  date: string // YYYY-MM-DD
  freeUsed: number
  paidJobs: number
  purchases: number
  revenueMxn: number
}

// Dos queries agregadas (no 30 × N) — group by día con SQL crudo, porque
// Prisma no expresa `date_trunc` + group-by en su API tipada.
export async function getDailySeries(days = 30): Promise<DaySeriesPoint[]> {
  const startOfToday = startOfTodayUTC()
  const since = new Date(startOfToday.getTime() - (days - 1) * 24 * 60 * 60 * 1000)

  const [jobRows, purchaseRows] = await Promise.all([
    prisma.$queryRaw<{ day: Date; tier: string; type: string; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") as day, tier, type, count(*)::bigint as count
      FROM "Job"
      WHERE "createdAt" >= ${since}
      GROUP BY 1, 2, 3
    `,
    prisma.$queryRaw<{ day: Date; delta: number; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") as day, delta, count(*)::bigint as count
      FROM "CreditTransaction"
      WHERE "createdAt" >= ${since} AND reason = 'PURCHASE' AND "externalId" IS NOT NULL
      GROUP BY 1, 2
    `,
  ])

  const byDay = new Map<string, DaySeriesPoint>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    byDay.set(key, { date: key, freeUsed: 0, paidJobs: 0, purchases: 0, revenueMxn: 0 })
  }

  for (const row of jobRows) {
    const key = row.day.toISOString().slice(0, 10)
    const point = byDay.get(key)
    if (!point) continue
    const count = Number(row.count)
    if (row.tier === 'FREE') point.freeUsed += count
    else if (row.tier === 'PAID') point.paidJobs += count
  }

  for (const row of purchaseRows) {
    const key = row.day.toISOString().slice(0, 10)
    const point = byDay.get(key)
    if (!point) continue
    const count = Number(row.count)
    point.purchases += count
    point.revenueMxn += count * (packageForCredits(row.delta)?.price ?? 0)
  }

  return Array.from(byDay.values())
}

export interface RecentPurchase {
  id: string
  createdAt: Date
  userEmail: string | null
  packageName: string
  amountMxn: number
}

export async function getRecentPurchases(limit = 20): Promise<RecentPurchase[]> {
  const rows = await prisma.creditTransaction.findMany({
    where: { reason: 'PURCHASE', externalId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, createdAt: true, delta: true, user: { select: { email: true } } },
  })

  return rows.map((r) => {
    const pkg = packageForCredits(r.delta)
    return {
      id: r.id,
      createdAt: r.createdAt,
      userEmail: r.user.email,
      packageName: pkg?.name ?? `${r.delta} créditos`,
      amountMxn: pkg?.price ?? 0,
    }
  })
}
