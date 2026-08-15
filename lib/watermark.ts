import sharp from 'sharp'

const FREE_PREVIEW_MAX_WIDTH = 800
const WATERMARK_LINES = ['Revívelos', 'Vista previa']

function buildWatermarkSvg(width: number, height: number, lines: string[]): string {
  const cols = 2
  const rows = 4
  const cellW = width / cols
  const cellH = height / rows

  // Tamaño de fuente que quepa la línea más larga dentro de ~70% del ancho
  // de la celda — evita que un texto de la marca de agua choque con el de
  // la celda vecina al rotar.
  const longest = Math.max(...lines.map((l) => l.length))
  const approxCharWidth = 0.56
  const maxFontFromWidth = (cellW * 0.7) / (longest * approxCharWidth)
  const fontSize = Math.max(10, Math.min(Math.round(cellH * 0.16), Math.round(maxFontFromWidth)))
  const lineGap = fontSize * 1.4

  const blocks: string[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * cellW + cellW / 2
      const cy = row * cellH + cellH / 2
      const startY = cy - ((lines.length - 1) * lineGap) / 2
      const tspans = lines
        .map((line, i) => `<tspan x="${cx}" y="${startY + i * lineGap}">${line}</tspan>`)
        .join('')
      blocks.push(`<text text-anchor="middle" class="wm">${tspans}</text>`)
    }
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .wm {
        fill: rgba(255,255,255,0.5);
        font-size: ${fontSize}px;
        font-family: sans-serif;
        font-weight: 600;
      }
    </style>
    <g transform="rotate(-28 ${width / 2} ${height / 2})">
      ${blocks.join('\n')}
    </g>
  </svg>`
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
  // o el SVG de marca de agua queda con un tamaño distinto al de la imagen
  // ya redimensionada y sharp lanza "must have same dimensions or smaller".
  const width = Math.min(maxWidth, originalWidth)
  const height = Math.round((originalHeight / originalWidth) * width)

  const watermarkSvg = buildWatermarkSvg(width, height, lines)

  const output = await image
    .resize({ width, height, fit: 'fill' })
    .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
    .jpeg({ quality: 82 })
    .toBuffer()

  return new Uint8Array(output)
}
