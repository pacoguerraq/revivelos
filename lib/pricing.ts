export const RESTORE_COST = 1  // créditos por restauración + colorización
export const ANIMATE_COST = 3  // créditos por video animado

export interface Package {
  id: string
  name: string
  credits: number
  price: number
  popular?: boolean
}

export const PACKAGES: Package[] = [
  {
    id: 'basico',
    name: 'Básico',
    credits: 5,
    price: 99,
  },
  {
    id: 'familiar',
    name: 'Familiar',
    credits: 15,
    price: 249,
    popular: true,
  },
  {
    id: 'album',
    name: 'Álbum completo',
    credits: 40,
    price: 599,
  },
]

export function calcEquivalencias(credits: number) {
  return {
    restores: Math.floor(credits / RESTORE_COST),
    videos: Math.floor(credits / ANIMATE_COST),
  }
}

// Costo real de API por operación en MXN, ya con el factor 1.3x de
// reintentos/regeneraciones/fallos aplicado — ver tabla "Costo por
// operación" en AGENTS.md. Usado por el dashboard de admin para estimar el
// gasto del día contra el ingreso. No cambiar sin actualizar esa tabla.
export const API_COST_MXN = {
  restorePaid: 3.33,
  restoreFree: 0.87,
  animate: 11.1,
} as const
