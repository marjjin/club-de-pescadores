import type { ClubEvent } from '../types'

const events: ClubEvent[] = [
  {
    id: 'fecha-6',
    title: 'Concurso de pesca deportiva - Fecha 6',
    startsOn: '2026-10-04',
    startsAt: '08:00',
    place: 'Muelle del club',
  },
  {
    id: 'torneo-socios',
    title: 'Torneo de socios',
    startsOn: '2026-11-15',
    startsAt: '08:00',
    place: 'Club de Pescadores',
  },
  {
    id: 'cierre',
    title: 'Cierre de temporada',
    startsOn: '2026-12-20',
    startsAt: '09:00',
    place: 'Club de Pescadores',
  },
]

// Datos del diseño. Se reemplazan por la consulta a Supabase sin tocar la interfaz.
export async function getUpcomingEvents(): Promise<ClubEvent[]> {
  const today = new Date().toISOString().slice(0, 10)
  return events.filter((event) => event.startsOn >= today)
}
