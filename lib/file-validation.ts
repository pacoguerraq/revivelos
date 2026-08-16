// Detección de tipo real por magic bytes — nunca confiar en la extensión
// del archivo ni en el Content-Type que manda el cliente, ambos los
// controla quien sube el archivo.
const SIGNATURES: { mime: string; check: (bytes: Uint8Array) => boolean }[] = [
  {
    mime: 'image/jpeg',
    check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    check: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: 'image/webp',
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, // "WEBP"
  },
  {
    mime: 'image/heic',
    check: (b) => {
      // Caja ISOBMFF: bytes 4-7 = "ftyp", 8-11 = marca del formato.
      const ftyp = String.fromCharCode(b[4], b[5], b[6], b[7])
      if (ftyp !== 'ftyp') return false
      const brand = String.fromCharCode(b[8], b[9], b[10], b[11])
      return ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)
    },
  },
]

const MAX_SIZE_BYTES = 15 * 1024 * 1024

export interface FileValidationError {
  message: string
}

// Valida tamaño y tipo real (por contenido, no por metadata declarada).
// Devuelve el mime real detectado si es válido, o un error humano si no.
export function validateImageFile(bytes: Uint8Array): { mime: string } | FileValidationError {
  if (bytes.length === 0) {
    return { message: 'No se recibió ninguna foto.' }
  }
  if (bytes.length > MAX_SIZE_BYTES) {
    return { message: 'La foto es demasiado grande. El máximo es 15 MB.' }
  }
  if (bytes.length < 12) {
    return { message: 'El archivo no parece ser una foto válida.' }
  }

  for (const sig of SIGNATURES) {
    if (sig.check(bytes)) return { mime: sig.mime }
  }

  return { message: 'Formato no reconocido. Sube una foto en JPG, PNG, WEBP o HEIC.' }
}

export function isFileValidationError(
  result: { mime: string } | FileValidationError,
): result is FileValidationError {
  return 'message' in result
}
