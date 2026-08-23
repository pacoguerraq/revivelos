'use client'

import { useEffect } from 'react'
import { trackViewContent } from '@/lib/meta-pixel'

// Sin marcado propio — solo dispara el evento al montar. Vive separado del
// resto de /resultado/[jobId] (Server Component) porque fbq solo existe en
// el navegador.
export function ViewContentTracker() {
  useEffect(() => {
    trackViewContent()
  }, [])

  return null
}
