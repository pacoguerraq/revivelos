'use client'

import * as s from '@/components/admin/styles'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

// Modal genérico del panel de admin — mismo look denso de components/admin/styles.ts,
// no el sistema de diseño público (ver nota en styles.ts). Reemplaza a
// window.confirm() donde se necesite mostrar el motivo/detalle de la
// acción antes de confirmarla, en vez de un alert nativo del navegador.
export function ConfirmModal({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div
      role="presentation"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(61, 43, 31, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 100,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ ...s.card, maxWidth: 420, width: '100%' }}
      >
        <div id="confirm-modal-title" style={s.sectionTitle}>
          {title}
        </div>
        <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-line', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
            style={{ minHeight: 38, padding: '0 20px' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-primary"
            style={{ minHeight: 38, padding: '0 20px' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
