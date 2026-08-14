import { put, del } from '@vercel/blob'

// Abstracción agnóstica de proveedor — hoy Vercel Blob, mañana R2 sin tocar
// la lógica de negocio que la consume.
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
