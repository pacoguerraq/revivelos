import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import * as s from '@/components/admin/styles'

export const metadata = { robots: { index: false, follow: false } }

const PAGE_SIZE = 25

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminUsersPage({ searchParams }: Props) {
  // Ver nota en dashboard/page.tsx: el chequeo del layout no basta por sí
  // solo, porque Next puede renderizar esta página en paralelo con el
  // layout antes de que su notFound() la detenga.
  if (!(await verifyAdminSession())) notFound()

  const { q, page: pageParam } = await searchParams
  const query = (q ?? '').trim()
  const page = Math.max(1, Number(pageParam) || 1)

  // Los usuarios anónimos (cookie uid sin cuenta real — dispositivos que
  // usaron el free tier o ni eso) no son "usuarios" en el sentido que le
  // importa a este panel: no tienen correo, no pueden comprar, y su fila
  // aquí solo era ruido ("(sin correo / anónimo)"). Se excluyen siempre.
  const where = {
    isAnonymous: false,
    ...(query ? { email: { contains: query, mode: 'insensitive' as const } } : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        credits: true,
        freeUsed: true,
        createdAt: true,
        _count: { select: { jobs: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={s.card}>
        <form method="get" style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar por correo…"
            style={{ flex: 1, padding: '8px 10px', border: '1px solid #D9C4A8', borderRadius: 6 }}
          />
          <button type="submit" className="btn btn-secondary" style={{ minHeight: 38, padding: '0 20px' }}>
            Buscar
          </button>
        </form>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>
          Usuarios ({total})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Correo</th>
                <th style={s.th}>Créditos</th>
                <th style={s.th}>Free usado</th>
                <th style={s.th}>Jobs</th>
                <th style={s.th}>Registro</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={s.td}>{u.email ?? '(sin correo)'}</td>
                  <td style={s.td}>{u.credits}</td>
                  <td style={s.td}>{u.freeUsed ? 'sí' : 'no'}</td>
                  <td style={s.td}>{u._count.jobs}</td>
                  <td style={s.td}>{u.createdAt.toLocaleDateString('es-MX')}</td>
                  <td style={s.td}>
                    <Link href={`/admin/usuarios/${u.id}`} style={{ color: '#8A5208' }}>
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td style={s.td} colSpan={6}>
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', fontSize: '0.85rem' }}>
          {page > 1 && (
            <Link href={`/admin/usuarios?q=${encodeURIComponent(query)}&page=${page - 1}`} style={{ color: '#8A5208' }}>
              ← Anterior
            </Link>
          )}
          <span>
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/usuarios?q=${encodeURIComponent(query)}&page=${page + 1}`} style={{ color: '#8A5208' }}>
              Siguiente →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
