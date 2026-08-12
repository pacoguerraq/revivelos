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
