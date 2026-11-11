import { initialField } from './content-fields'
import { contentInputs } from './schemas/admin'
import type { News } from './schemas/admin'

export type PublicationMode = 'draft' | 'now' | 'scheduled'
export type NewsEditorValues = Pick<
  News,
  | 'title'
  | 'excerpt'
  | 'image_url'
  | 'image_alt'
  | 'image_focus_x'
  | 'image_focus_y'
> & { published_at: string; publication: PublicationMode }
export type NewsEditorErrors = Partial<Record<keyof NewsEditorValues, string>>

export function initialNewsValues(row: News | null): NewsEditorValues {
  return {
    title: row?.title ?? '',
    excerpt: row?.excerpt ?? '',
    image_url: row?.image_url ?? '',
    image_alt: row?.image_alt ?? '',
    image_focus_x: row?.image_focus_x ?? 50,
    image_focus_y: row?.image_focus_y ?? 50,
    published_at: initialField(row, 'published_at', 'datetime-local'),
    publication: !row?.is_published
      ? 'draft'
      : new Date(row.published_at) > new Date()
        ? 'scheduled'
        : 'now',
  }
}

export function safeNewsImage(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}

export function validateNewsEditor(
  values: NewsEditorValues,
  row: News | null,
  now = new Date(),
) {
  const errors: NewsEditorErrors = {}
  let publishedAt = row?.published_at ?? now.toISOString()
  if (
    values.publication === 'now' &&
    (!row?.is_published || new Date(row.published_at) > now)
  )
    publishedAt = now.toISOString()
  if (values.publication === 'scheduled') {
    const date = new Date(`${values.published_at}-03:00`)
    if (!values.published_at || !Number.isFinite(date.getTime()) || date <= now)
      errors.published_at =
        'Elegí una fecha y hora futuras para programar la noticia.'
    else
      publishedAt =
        row &&
        values.published_at ===
          initialField(row, 'published_at', 'datetime-local')
          ? row.published_at
          : date.toISOString()
  }
  if (!safeNewsImage(values.image_url))
    errors.image_url = 'Subí una imagen o ingresá un enlace HTTPS válido.'
  const parsed = contentInputs.news.safeParse({
    ...values,
    published_at: publishedAt,
    is_published: values.publication !== 'draft',
  })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      switch (issue.path[0]) {
        case 'title':
          errors.title =
            values.title.trim().length > 180
              ? 'El título admite hasta 180 caracteres.'
              : 'Escribí un título para la noticia.'
          break
        case 'excerpt':
          errors.excerpt =
            values.excerpt.trim().length > 1200
              ? 'El texto admite hasta 1200 caracteres.'
              : 'Completá el texto de la noticia.'
          break
        case 'image_url':
          errors.image_url =
            'Subí una imagen o ingresá un enlace HTTPS válido de hasta 2048 caracteres.'
          break
        case 'image_alt':
          errors.image_alt =
            values.image_alt.trim().length > 300
              ? 'La descripción admite hasta 300 caracteres.'
              : 'Describí brevemente qué se ve en la imagen.'
          break
      }
    }
  }
  if (!parsed.success || Object.keys(errors).length)
    return { success: false as const, errors }
  return { success: true as const, data: parsed.data }
}
