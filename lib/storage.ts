import { put, del } from '@vercel/blob'

// Abstracción agnóstica de proveedor — hoy Vercel Blob, mañana R2 sin tocar
// la lógica de negocio que la consume.
//
// Nota: `access: 'private'` + URLs firmadas de corta duración (Vercel Blob
// sí las soporta vía issueSignedToken/presignUrl) quedaron evaluadas y
// descartadas por ahora — el store actual de este proyecto está
// configurado como 'public' a nivel de store, y Vercel Blob no permite
// mezclar objetos 'private' dentro de un store 'public' ("Cannot use
// private access on a public store"). Requeriría provisionar un store
// nuevo (paso manual en el dashboard de Vercel), así que se documenta como
// pendiente en AGENTS.md en vez de dejar código sin usar aquí.
export interface StorageAdapter {
  put(key: string, data: Uint8Array, contentType: string): Promise<string>
  delete(url: string): Promise<void>
}

class VercelBlobStorage implements StorageAdapter {
  async put(key: string, data: Uint8Array, contentType: string): Promise<string> {
    const blob = await put(key, Buffer.from(data), {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    })
    return blob.url
  }

  async delete(url: string): Promise<void> {
    await del(url)
  }
}

export const storage: StorageAdapter = new VercelBlobStorage()
