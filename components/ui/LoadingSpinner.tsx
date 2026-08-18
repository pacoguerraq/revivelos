// Contenido compartido de los loading.tsx por ruta — ver AGENTS.md,
// sección "CLS: loading.tsx por ruta, no uno global en la raíz".
export function LoadingSpinner() {
  return (
    <div className="py-20 flex justify-center">
      <svg
        className="animate-spin"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Cargando"
        role="status"
        style={{ color: 'var(--color-amber)' }}
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}
