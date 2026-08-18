import sharp from 'sharp'

// Miniatura para la cuadrícula de /mis-fotos — ver AGENTS.md, sección
// "Miniaturas de /mis-fotos". WebP a ~400px de ancho: suficiente para una
// tarjeta que nunca se muestra a más de ~300px CSS (incluso en retina), muy
// por debajo del peso de la foto/video completos.
const THUMBNAIL_MAX_WIDTH = 400

export async function generateThumbnail(input: Uint8Array): Promise<Uint8Array> {
  const output = await sharp(Buffer.from(input))
    .resize({ width: THUMBNAIL_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer()

  return new Uint8Array(output)
}
