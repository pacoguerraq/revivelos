import { Suspense } from 'react'
import Link from 'next/link'
import { CameraIcon } from '@/components/icons/CameraIcon'
import { HeaderNavData } from './HeaderNavData'

// El badge de créditos y la cuenta dependen de una consulta a la DB
// (getUserId + auth + getBalance, en HeaderNavData). Antes esa consulta
// vivía directo en este componente, sin límite de Suspense propio — eso
// bloqueaba TODO el árbol de React que sigue (incluida la página completa,
// vía el Suspense automático que crea app/loading.tsx alrededor de
// {children} en el layout raíz), así que cualquier latencia real de Neon
// hacía que el navegador pintara primero el spinner genérico de
// loading.tsx y luego, de golpe, la landing completa — el salto de layout
// (CLS) más grande medido en PageSpeed. Aislar la consulta en su propio
// Suspense, con un fallback del mismo tamaño que el contenido real,
// confina cualquier espera visible a esta franja angosta del navbar y deja
// que el resto de la página (que no depende de ningún dato) se envíe de
// inmediato en el primer render.
function HeaderNavSkeleton() {
  return (
    <div className="flex items-center gap-1.5 md:gap-3" aria-hidden style={{ height: 38 }}>
      <div className="rounded-full" style={{ width: 84, height: 30, background: 'var(--color-sepia-100)' }} />
      <div className="rounded-full" style={{ width: 38, height: 38, background: 'var(--color-sepia-100)' }} />
    </div>
  )
}

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: 'rgba(250, 246, 240, 0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-sepia-100)',
      }}
    >
      <div
        className="section-wrap flex items-center justify-between gap-2 md:gap-4"
        style={{ paddingTop: 18, paddingBottom: 18 }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 md:gap-2 flex-shrink-0"
          style={{ textDecoration: 'none', color: 'var(--color-bark)' }}
          aria-label="Revívelos — Inicio"
        >
          <CameraIcon size={20} />
          <span
            className="font-bold leading-none"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.95rem, 4vw, 1.15rem)' }}
          >
            Revívelos
          </span>
        </Link>

        <Suspense fallback={<HeaderNavSkeleton />}>
          <HeaderNavData />
        </Suspense>
      </div>
    </header>
  )
}
