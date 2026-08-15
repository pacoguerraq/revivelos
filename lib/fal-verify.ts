import { createHash, createPublicKey, verify } from 'node:crypto'

interface FalJwk {
  kty: string
  crv: string
  x: string
}

const JWKS_URL = 'https://rest.alpha.fal.ai/.well-known/jwks.json'
const JWKS_TTL_MS = 24 * 60 * 60 * 1000
const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60

let cachedKeys: FalJwk[] | null = null
let cachedAt = 0

async function getJwks(forceRefresh = false): Promise<FalJwk[]> {
  const isStale = Date.now() - cachedAt > JWKS_TTL_MS
  if (!cachedKeys || isStale || forceRefresh) {
    const res = await fetch(JWKS_URL)
    if (!res.ok) throw new Error('No se pudo obtener el JWKS de fal')
    const data = (await res.json()) as { keys: FalJwk[] }
    cachedKeys = data.keys
    cachedAt = Date.now()
  }
  return cachedKeys
}

export interface FalWebhookHeaders {
  requestId: string
  userId: string
  timestamp: string
  signature: string
}

// Verificación ED25519 contra el JWKS de fal. Requiere el body crudo — debe
// llamarse con el texto exacto recibido, antes de cualquier JSON.parse.
export async function verifyFalWebhook(
  rawBody: string,
  headers: FalWebhookHeaders,
): Promise<boolean> {
  const timestampSeconds = Number(headers.timestamp)
  if (!Number.isFinite(timestampSeconds)) return false

  const skew = Math.abs(Date.now() / 1000 - timestampSeconds)
  if (skew > MAX_TIMESTAMP_SKEW_SECONDS) return false

  const bodyHash = createHash('sha256').update(rawBody, 'utf8').digest('hex')
  const message = Buffer.from(
    `${headers.requestId}\n${headers.userId}\n${headers.timestamp}\n${bodyHash}`,
    'utf8',
  )

  let signature: Buffer
  try {
    signature = Buffer.from(headers.signature, 'hex')
  } catch {
    return false
  }

  const tryKeys = (keys: FalJwk[]): boolean => {
    for (const jwk of keys) {
      if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519') continue
      try {
        const publicKey = createPublicKey({
          key: { kty: 'OKP', crv: 'Ed25519', x: jwk.x },
          format: 'jwk',
        })
        if (verify(null, message, publicKey, signature)) return true
      } catch {
        continue
      }
    }
    return false
  }

  const keys = await getJwks()
  if (tryKeys(keys)) return true

  // Las llaves pudieron haber rotado — se refresca una vez y se reintenta.
  const freshKeys = await getJwks(true)
  return tryKeys(freshKeys)
}
