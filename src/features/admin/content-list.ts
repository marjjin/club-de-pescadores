import type { Content, ContentKind } from './schemas/admin'

export const contentListCopy: Record<
  ContentKind,
  {
    description: string
    noun: string
    emptyTitle: string
    emptyDescription: string
    publishedLabel: string
    publicPath: string | null
  }
> = {
  news: {
    description:
      'Publicá fotos y condiciones del muelle, avisos y novedades del club.',
    noun: 'noticias',
    emptyTitle: 'Tu próxima noticia empieza acá',
    emptyDescription:
      'Subí una foto del muelle y contá las condiciones para pescar, o compartí otra novedad del club. Podés preparar un borrador antes de publicar.',
    publishedLabel: 'Publicadas',
    publicPath: '/noticias',
  },
  events: {
    description: 'Organizá las próximas actividades y mantené al club al día.',
    noun: 'eventos',
    emptyTitle: 'Dale lugar al próximo encuentro',
    emptyDescription:
      'Creá un evento con su fecha y lugar. Guardalo como borrador hasta tener todo confirmado.',
    publishedLabel: 'Publicados',
    publicPath: '/eventos',
  },
  pool_rates: {
    description:
      'Mantené los precios, las condiciones y las vigencias de la pileta al día.',
    noun: 'tarifas',
    emptyTitle: 'Todo listo para cargar tus tarifas',
    emptyDescription:
      'Definí los precios y la vigencia. Podés revisar las condiciones antes de publicarlas.',
    publishedLabel: 'Publicadas',
    publicPath: null,
  },
}

export function contentStatus(row: Content) {
  if (row.deleted_at)
    return {
      label: 'En papelera',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
    }
  if (!row.is_published)
    return {
      label: 'Borrador',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
    }
  if ('published_at' in row && new Date(row.published_at) > new Date())
    return {
      label: 'Programada',
      className: 'border-sky-200 bg-sky-50 text-sky-800',
    }
  return {
    label: 'starts_at' in row ? 'Publicado' : 'Publicada',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }
}
