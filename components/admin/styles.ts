import type { CSSProperties } from 'react'

// Estilos compartidos del panel de admin — denso y funcional, no cálido ni
// mobile-first (ver AGENTS.md). Objetos planos en vez de clases para no
// tocar el sistema de diseño público.
export const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #D9C4A8',
  borderRadius: 8,
  padding: 16,
}

export const table: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85rem',
}

export const th: CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  borderBottom: '2px solid #D9C4A8',
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

export const td: CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid #EDE0CC',
  whiteSpace: 'nowrap',
}

export const statValue: CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 700,
  lineHeight: 1.1,
}

export const statLabel: CSSProperties = {
  fontSize: '0.75rem',
  color: '#7A5C45',
  marginTop: 4,
}

export const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
}

export const sectionTitle: CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  marginBottom: 12,
}
