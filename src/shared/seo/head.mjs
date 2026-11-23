// Server-side <head> for crawlers and link previews (WhatsApp, Facebook), used by the
// build (static pages) and the Vercel function (news, tournaments). The site renders the
// same title, description and canonical once it loads, so both always agree.
import { CLUB, SITE_LOCALE, SITE_NAME } from './pages.mjs'

const START = '<!--seo:start-->'
const END = '<!--seo:end-->'

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** JSON-LD safe inside a <script>: no "</script>" can close it early. */
export function jsonLdScript(data) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
  return `<script type="application/ld+json">${json}</script>`
}

/**
 * Title, description, canonical, robots, Open Graph and Twitter tags. The first four
 * carry data-seo: the app removes them on start and renders its own (see main.tsx).
 */
export function headTags({
  siteUrl,
  title,
  description,
  path,
  index = true,
  image,
  imageAlt,
  imageWidth,
  imageHeight,
  type = 'website',
  publishedTime,
  jsonLd = [],
}) {
  const url = `${siteUrl}${path === '/' ? '/' : path}`
  const picture = image ?? `${siteUrl}/og-image.jpg`
  const known = !image
  const tags = [
    `<title data-seo>${escapeHtml(title)}</title>`,
    `<meta data-seo name="description" content="${escapeHtml(description)}" />`,
    `<meta data-seo name="robots" content="${index ? 'index, follow, max-image-preview:large' : 'noindex, follow'}" />`,
    index ? `<link data-seo rel="canonical" href="${escapeHtml(url)}" />` : '',
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:locale" content="${SITE_LOCALE}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(picture)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(imageAlt ?? SITE_NAME)}" />`,
    known || imageWidth
      ? `<meta property="og:image:width" content="${imageWidth ?? 1200}" />`
      : '',
    known || imageHeight
      ? `<meta property="og:image:height" content="${imageHeight ?? 630}" />`
      : '',
    publishedTime
      ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />`
      : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(picture)}" />`,
    ...jsonLd.map(jsonLdScript),
  ]
  return tags.filter(Boolean).join('\n    ')
}

/** Replaces the generic block between the seo markers of index.html. */
export function applyHead(template, head, extra = '') {
  const start = template.indexOf(START)
  const end = template.indexOf(END)
  if (start < 0 || end < start)
    throw new Error(
      'index.html no tiene los marcadores <!--seo:start--> y <!--seo:end-->.',
    )
  return `${template.slice(0, start)}${START}\n    ${head}${extra ? `\n    ${extra}` : ''}\n    ${template.slice(end)}`
}

// Structured data -----------------------------------------------------------------------

const clubId = (siteUrl) => `${siteUrl}/#club`

/** The club itself, on every page. Only facts published on the site. */
export function clubJsonLd(siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SportsClub',
        '@id': clubId(siteUrl),
        name: CLUB.name,
        url: `${siteUrl}/`,
        logo: `${siteUrl}/logo.png`,
        image: `${siteUrl}/og-image.jpg`,
        telephone: CLUB.telephone,
        sport: 'Pesca deportiva',
        sameAs: CLUB.profiles,
        ...(CLUB.openAllDay
          ? {
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ],
                opens: '00:00',
                closes: '23:59',
              },
            }
          : {}),
        address: {
          '@type': 'PostalAddress',
          streetAddress: CLUB.street,
          postalCode: CLUB.postalCode,
          addressLocality: CLUB.locality,
          addressRegion: CLUB.region,
          addressCountry: CLUB.country,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: CLUB.name,
        url: `${siteUrl}/`,
        inLanguage: 'es-AR',
        publisher: { '@id': clubId(siteUrl) },
      },
    ],
  }
}

export function breadcrumbsJsonLd(siteUrl, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  }
}

export function newsArticleJsonLd(siteUrl, news) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.title.slice(0, 110),
    description: news.description,
    datePublished: news.publishedAt,
    ...(news.updatedAt ? { dateModified: news.updatedAt } : {}),
    ...(news.image ? { image: [news.image] } : {}),
    mainEntityOfPage: `${siteUrl}/noticias/${news.id}`,
    author: { '@id': clubId(siteUrl) },
    publisher: { '@id': clubId(siteUrl) },
    inLanguage: 'es-AR',
  }
}

/** A tournament held at the club; dates and place come from the tournament itself. */
export function tournamentJsonLd(siteUrl, tournament) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournament.name,
    sport: 'Pesca deportiva',
    startDate: tournament.startsOn,
    ...(tournament.endsOn ? { endDate: tournament.endsOn } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(tournament.description ? { description: tournament.description } : {}),
    url: `${siteUrl}/torneos/${tournament.id}`,
    image: [`${siteUrl}/og-image.jpg`],
    location: {
      '@type': 'Place',
      name: tournament.place || CLUB.name,
      address: {
        '@type': 'PostalAddress',
        // Without a place of its own the tournament is at the club, whose street is known.
        ...(tournament.place
          ? {}
          : { streetAddress: CLUB.street, postalCode: CLUB.postalCode }),
        addressLocality: CLUB.locality,
        addressRegion: CLUB.region,
        addressCountry: CLUB.country,
      },
    },
    organizer: { '@id': clubId(siteUrl) },
  }
}
