import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const [beforeData, afterData] = await Promise.all([
  readFile(join(process.cwd(), 'public/ejemplos/hero-antes.jpg'), 'base64'),
  readFile(join(process.cwd(), 'public/ejemplos/hero-despues.jpg'), 'base64'),
])
const beforeSrc = `data:image/jpeg;base64,${beforeData}`
const afterSrc = `data:image/jpeg;base64,${afterData}`

// Compone la imagen para compartir (OG / Twitter Card) con las fotos reales
// de ejemplo. Vive en lib/ (módulo normal) a propósito: los archivos de
// convención especial de Next.js (opengraph-image.tsx, twitter-image.tsx)
// no se pueden importar entre sí en dev — Turbopack falla en resolver ese
// import silenciosamente y Next cae a una imagen genérica propia sin avisar
// con un error visible al navegar. Un módulo normal compartido evita el
// problema por completo.
export async function renderShareImage(size: { width: number; height: number }): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#FAF6F0',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', width: '100%', height: 522 }}>
          <div style={{ display: 'flex', width: '50%', height: '100%', position: 'relative' }}>
            <img
              src={beforeSrc}
              alt=""
              width={600}
              height={522}
              style={{ objectFit: 'cover', filter: 'grayscale(55%) contrast(0.92)' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                display: 'flex',
                background: 'rgba(61,43,31,0.7)',
                color: '#FDF9F4',
                fontSize: 22,
                fontWeight: 700,
                padding: '8px 20px',
                borderRadius: 9999,
              }}
            >
              Antes
            </div>
          </div>
          <div style={{ display: 'flex', width: '50%', height: '100%', position: 'relative' }}>
            <img
              src={afterSrc}
              alt=""
              width={600}
              height={522}
              style={{ objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                display: 'flex',
                background: '#A8640A',
                color: '#fff',
                fontSize: 22,
                fontWeight: 700,
                padding: '8px 20px',
                borderRadius: 9999,
              }}
            >
              Después
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 108,
            background: '#3D2B1F',
          }}
        >
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#fff', marginRight: 16 }}>
            Revívelos
          </div>
          <div style={{ display: 'flex', fontSize: 21, color: '#EDE0CC' }}>
            Restaura y anima las fotos de tu familia con IA
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
