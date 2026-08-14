export interface Ejemplo {
  id: number
  titulo: string
  descripcion: string
  beforeSrc: string
  afterSrc: string
}

// Pon tus imágenes reales en /public/ejemplos/
// Nombres esperados: /ejemplos/1-antes.jpg, /ejemplos/1-despues.jpg, etc.
export const EJEMPLOS: Ejemplo[] = [
  {
    id: 1,
    titulo: 'Retrato familiar, años 60',
    descripcion: 'Foto con manchas de humedad. Restaurada y coloreada.',
    beforeSrc: '/ejemplos/1-antes.jpg',
    afterSrc: '/ejemplos/1-despues.jpg',
  },
  {
    id: 2,
    titulo: 'Autorretrato, años 50',
    descripcion: 'Foto sepia con rasgaduras en los bordes. Reparada y con color natural.',
    beforeSrc: '/ejemplos/2-antes.jpg',
    afterSrc: '/ejemplos/2-despues.jpg',
  },
  {
    id: 3,
    titulo: 'Niños en el patio, años 65',
    descripcion: 'Foto deteriorada por el tiempo. Daños eliminados y tonos de piel recuperados.',
    beforeSrc: '/ejemplos/3-antes.jpg',
    afterSrc: '/ejemplos/3-despues.jpg',
  },
]
