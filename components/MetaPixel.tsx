'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

// Mismo NEXT_PUBLIC_FB_PIXEL_ID que usa lib/meta-capi.ts para el Purchase
// server-side — un solo pixel ID en todo el proyecto (regla de single
// source of truth de AGENTS.md), nunca dos variables distintas para la
// misma cosa.
const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

// App Router no hace un reload de página en navegación client-side, así
// que fbq('track', 'PageView') del script inline solo cubre la primera
// carga. Este componente vuelve a dispararlo en cada cambio de ruta.
//
// useSearchParams() opta la página que lo usa fuera del render estático a
// menos que esté envuelto en su propio <Suspense> (requisito de Next.js
// App Router) — por eso vive separado del <Script>/<noscript>, que sí
// pueden ir directo en el árbol sin ese costo.
function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (!PIXEL_ID) return
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return // el primer PageView ya lo dispara el script inline al cargar — no duplicar
    }
    if (!window.fbq) return
    window.fbq('track', 'PageView')
  }, [pathname, searchParams])

  return null
}

export function MetaPixel() {
  if (!PIXEL_ID) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- pixel de seguimiento externo, no una imagen del sitio */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}
