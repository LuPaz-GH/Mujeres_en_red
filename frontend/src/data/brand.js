// Colores oficiales del logo (tomados del isotipo)
export const BRAND = {
  naranja: '#DE6F20',
  celeste: '#0EABE2',
  verde: '#78B833',
  rosa: '#EB5D9D',
  violeta: '#614491',
}

// Pétalos del logo, en el orden en que aparecen (sentido horario desde arriba)
// angle: hacia dónde apunta el pétalo, en grados (0 = derecha, 90 = arriba)
export const PETALS = [
  { color: BRAND.celeste, angle: 78 },
  { color: BRAND.verde, angle: 4 },
  { color: BRAND.violeta, angle: -78 },
  { color: BRAND.rosa, angle: -168 },
  { color: BRAND.naranja, angle: 130 },
]

export const PETAL_COLORS = PETALS.map((p) => p.color)
