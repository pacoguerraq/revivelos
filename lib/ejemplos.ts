export interface Ejemplo {
  id: number
  titulo: string
  descripcion: string
  beforeSrc: string
  afterSrc: string
  beforeAlt: string
  afterAlt: string
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
    beforeAlt: 'Retrato familiar en blanco y negro de los años 60 con manchas de humedad y decoloración',
    afterAlt: 'El mismo retrato familiar restaurado, sin manchas y con color natural',
  },
  {
    id: 2,
    titulo: 'Autorretrato, años 50',
    descripcion: 'Foto sepia con rasgaduras en los bordes. Reparada y con color natural.',
    beforeSrc: '/ejemplos/2-antes.jpg',
    afterSrc: '/ejemplos/2-despues.jpg',
    beforeAlt: 'Autorretrato sepia de los años 50 con rasgaduras y desgaste en los bordes',
    afterAlt: 'El mismo autorretrato reparado, sin rasgaduras y con color natural',
  },
  {
    id: 3,
    titulo: 'Niños en el patio, años 65',
    descripcion: 'Foto deteriorada por el tiempo. Daños eliminados y tonos de piel recuperados.',
    beforeSrc: '/ejemplos/3-antes.jpg',
    afterSrc: '/ejemplos/3-despues.jpg',
    beforeAlt: 'Foto de niños jugando en un patio, años 65, deteriorada por el paso del tiempo',
    afterAlt: 'La misma foto de los niños en el patio restaurada, con tonos de piel naturales',
  },
]
