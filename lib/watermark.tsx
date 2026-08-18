import sharp from 'sharp'
import { ImageResponse } from 'next/og'

const FREE_PREVIEW_MAX_WIDTH = 800
const WATERMARK_LINES = ['Revívelos', 'Vista previa']

// El texto se renderiza con satori (next/og), no como <text> de SVG
// compuesto vía sharp/librsvg: librsvg delega el layout de texto a
// Pango + fontconfig, que en el runtime serverless de Vercel no tiene
// ninguna fuente registrada — el resultado es "tofu" (glifos rotos/símbolos
// raros) en vez del texto. satori trae su propia fuente por defecto
// embebida (el mismo motor que ya usa lib/og-image.tsx, donde acentos como
// "Después" ya se renderizan bien), así que no depende de fuentes del
// sistema en ningún entorno.
async function buildWatermarkPng(width: number, height: number, lines: string[]): Promise<Buffer> {
  const cols = 2
  const rows = 4
  const cellW = width / cols
  const cellH = height / rows

  // Misma heurística de tamaño de fuente que antes: que la línea más larga
  // quepa en ~70% del ancho de la celda.
  const longest = Math.max(...lines.map((l) => l.length))
  const approxCharWidth = 0.56
  const maxFontFromWidth = (cellW * 0.7) / (longest * approxCharWidth)
  const fontSize = Math.max(10, Math.min(Math.round(cellH * 0.16), Math.round(maxFontFromWidth)))

  const cells = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push(
        <div
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            left: col * cellW,
            top: row * cellH,
            width: cellW,
            height: cellH,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-28deg)',
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize,
                fontWeight: 600,
              }}
            >
              {line}
            </div>
          ))}
        </div>,
      )
    }
  }

  const response = new ImageResponse(
    (
      <div style={{ width, height, display: 'flex', position: 'relative' }}>
        {cells}
      </div>
    ),
    { width, height },
  )

  return Buffer.from(await response.arrayBuffer())
}

// Reduce resolución y aplica una marca de agua repetida y discreta —
// visible pero que no destruye la foto. Parametrizable para reusar en
// otros contextos si hace falta.
export async function applyFreePreviewWatermark(
  input: Uint8Array,
  options: { maxWidth?: number; lines?: string[] } = {},
): Promise<Uint8Array> {
  const maxWidth = options.maxWidth ?? FREE_PREVIEW_MAX_WIDTH
  const lines = options.lines ?? WATERMARK_LINES

  const image = sharp(Buffer.from(input))
  const original = await image.metadata()
  const originalWidth = original.width ?? maxWidth
  const originalHeight = original.height ?? maxWidth

  // metadata() refleja las dimensiones de ENTRADA, no las de un resize()
  // encolado — hay que calcular el tamaño final a mano antes de componer,
  // o la marca de agua queda con un tamaño distinto al de la imagen ya
  // redimensionada y sharp lanza "must have same dimensions or smaller".
  const width = Math.min(maxWidth, originalWidth)
  const height = Math.round((originalHeight / originalWidth) * width)

  const watermarkPng = await buildWatermarkPng(width, height, lines)

  const output = await image
    .resize({ width, height, fit: 'fill' })
    .composite([{ input: watermarkPng, top: 0, left: 0 }])
    .jpeg({ quality: 82 })
    .toBuffer()

  return new Uint8Array(output)
}
