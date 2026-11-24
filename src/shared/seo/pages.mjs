// Plain JavaScript so the build script and the Vercel function can import it as-is;
// the site imports it through pages.d.mts. One source for every public page's metadata.

export const SITE_NAME = 'Club de Pescadores San Nicolás'
export const SITE_LOCALE = 'es_AR'

/** Facts shown on the site; nothing here may be invented for search engines. */
export const CLUB = {
  name: SITE_NAME,
  street: 'Leandro Alem 1352',
  postalCode: '2900',
  locality: 'San Nicolás de los Arroyos',
  region: 'Buenos Aires',
  country: 'AR',
  telephone: '+54 9 336 425-0033',
  whatsapp: 'https://wa.me/5493364250033',
  // Confirmed by the club on 17/11/2026: open every day, all day.
  openAllDay: true,
  profiles: [
    'https://www.instagram.com/clubdepescadores.sn/',
    'https://www.facebook.com/ClubDePescadoresSN',
  ],
}

export const PAGES = {
  home: {
    path: '/',
    title: 'Club de Pescadores San Nicolás | Pesca, muelle, torneos y pileta',
    description:
      'Club de pesca deportiva en San Nicolás, Buenos Aires: muelle sobre el río, torneos de pesca, quincho, parrillas y pileta de verano. Conocé el club y sumate como socio.',
  },
  news: {
    path: '/noticias',
    title: 'Noticias del club | Club de Pescadores San Nicolás',
    description:
      'Novedades, torneos, capturas y actividades del Club de Pescadores San Nicolás.',
  },
  events: {
    path: '/eventos',
    title: 'Eventos y actividades | Club de Pescadores San Nicolás',
    description:
      'Calendario de eventos, torneos y actividades del Club de Pescadores San Nicolás.',
  },
  tournaments: {
    path: '/torneos',
    title: 'Torneos de pesca | Club de Pescadores San Nicolás',
    description:
      'Torneos de pesca del Club de Pescadores San Nicolás: tablas de posiciones en vivo, resultados y tablas anuales por categoría.',
  },
  privacy: {
    path: '/privacidad',
    title: 'Privacidad | Club de Pescadores San Nicolás',
    description:
      'Qué datos personales publica y guarda el Club de Pescadores San Nicolás en su sitio y cómo pedir que los corrija o los quite.',
  },
  notFound: {
    path: '/404',
    title: 'Página no encontrada | Club de Pescadores San Nicolás',
    description: 'La dirección no corresponde a una página del sitio.',
  },
}

/** "Title | Club de Pescadores San Nicolás", without repeating the club name. */
export function pageTitle(name) {
  const clean = String(name ?? '').trim()
  return !clean || clean === SITE_NAME ? SITE_NAME : `${clean} | ${SITE_NAME}`
}

/** One line of plain text, cut on a word boundary (search results show ~155 characters). */
export function clip(text, max = 155) {
  const plain = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:–-]+$/, '')}…`
}

/** Shared by the tournament page and the server-rendered preview, so both match. */
export function tournamentDescription({ name, description }) {
  return clip(
    description
      ? `${name}: ${description}`
      : `Tabla de posiciones de ${name}, torneo de pesca del ${SITE_NAME}.`,
  )
}

export function annualTableTitle({ name, year }) {
  return pageTitle(`${name} ${year}`)
}

export function annualTableDescription({ name, year }) {
  return clip(
    `${name} ${year}: tabla anual por categoría con los puntos de los torneos de pesca del ${SITE_NAME}.`,
  )
}
