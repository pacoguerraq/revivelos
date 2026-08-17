import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { clearAdminSession, verifyAdminSession } from '@/lib/admin-auth'

async function logout() {
  'use server'
  await clearAdminSession()
  redirect('/admin')
}

// Nada de UI aquí es cálida ni mobile-first a propósito — es una
// herramienta interna de una sola persona, vista en escritorio (ver
// AGENTS.md, sección Admin). Sin cookie válida, 404 — no un 401 que
// confirme que la ruta existe.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await verifyAdminSession())) notFound()

  return (
    <div style={{ minHeight: '100vh', background: '#F4F1EC', color: '#1a1a1a', fontFamily: 'var(--font-sans)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: '#20160e',
          color: '#fff',
        }}
      >
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <strong>Admin Revívelos</strong>
          <Link href="/admin/dashboard" style={{ color: '#EDE0CC' }}>
            Dashboard
          </Link>
          <Link href="/admin/usuarios" style={{ color: '#EDE0CC' }}>
            Usuarios
          </Link>
        </nav>
        <form action={logout}>
          <button
            type="submit"
            style={{ background: 'transparent', border: '1px solid #7A5C45', color: '#EDE0CC', borderRadius: 6, padding: '6px 14px', fontSize: '0.85rem' }}
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>{children}</main>
    </div>
  )
}
