'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdjustCreditsForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [delta, setDelta] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = Number(delta)
    if (!Number.isInteger(parsed) || parsed === 0) {
      setError('Ingresa un número entero distinto de cero (positivo suma, negativo resta).')
      return
    }
    if (!note.trim()) {
      setError('El motivo es obligatorio.')
      return
    }

    const verb = parsed > 0 ? 'sumar' : 'restar'
    const confirmed = window.confirm(
      `¿Confirmas ${verb} ${Math.abs(parsed)} crédito(s) a este usuario?\n\nMotivo: ${note.trim()}`,
    )
    if (!confirmed) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: parsed, note: note.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'No se pudo aplicar el ajuste.')
        return
      }
      setDelta('')
      setNote('')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
      {error && <div style={{ color: '#B84040', fontSize: '0.85rem' }}>{error}</div>}
      <label style={{ fontSize: '0.8rem' }}>
        Ajuste (positivo suma, negativo resta)
        <input
          type="number"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '6px 8px', border: '1px solid #D9C4A8', borderRadius: 6, marginTop: 4 }}
        />
      </label>
      <label style={{ fontSize: '0.8rem' }}>
        Motivo (obligatorio)
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. compensación por bug reportado por correo"
          style={{ display: 'block', width: '100%', padding: '6px 8px', border: '1px solid #D9C4A8', borderRadius: 6, marginTop: 4 }}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary"
        style={{ minHeight: 38, alignSelf: 'flex-start', padding: '0 20px' }}
      >
        {submitting ? 'Aplicando…' : 'Aplicar ajuste'}
      </button>
    </form>
  )
}
