import type { PoolRate } from '../types'

// Valores del afiche de la temporada 2026/2027.
export async function getPoolRates(): Promise<PoolRate[]> {
  return [
    {
      id: 'oct-nov',
      period: 'Octubre y noviembre 2026',
      familyPrice: 300000,
      individualPrice: 200000,
    },
    {
      id: 'dic',
      period: 'A partir de diciembre 2026',
      familyPrice: 450000,
      individualPrice: 300000,
    },
  ]
}
