import { expect, it } from 'vitest'
import {
  initialNewsValues,
  safeNewsImage,
  validateNewsEditor,
} from './news-editor'
import type { NewsEditorValues } from './news-editor'
import type { News } from './schemas/admin'

const now = new Date('2030-06-01T12:00:00Z')
const values: NewsEditorValues = {
  title: 'Noticia de prueba',
  excerpt: 'Texto de prueba.',
  image_url: 'https://example.test/image.webp',
  image_alt: 'Descripción de prueba',
  published_at: '',
  publication: 'draft',
}
const published: News = {
  ...values,
  id: '20000000-0000-4000-8000-000000000001',
  published_at: '2020-01-01T10:30:42.123Z',
  is_published: true,
  deleted_at: null,
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2020-01-01T00:00:00Z',
}

it('starts with a draft and does not require a date to save it', () => {
  expect(initialNewsValues(null)).toMatchObject({
    publication: 'draft',
    published_at: '',
  })
  const result = validateNewsEditor(values, null, now)
  expect(result).toMatchObject({
    success: true,
    data: { is_published: false, published_at: now.toISOString() },
  })
})
it('publishes a new draft now and preserves the release date when editing a published article', () => {
  expect(
    validateNewsEditor({ ...values, publication: 'now' }, null, now),
  ).toMatchObject({
    success: true,
    data: { published_at: now.toISOString(), is_published: true },
  })
  expect(
    validateNewsEditor({ ...values, publication: 'now' }, published, now),
  ).toMatchObject({
    success: true,
    data: { published_at: published.published_at },
  })
})
it('converts a future Argentina time into an absolute publication timestamp', () => {
  expect(
    validateNewsEditor(
      { ...values, publication: 'scheduled', published_at: '2030-06-02T10:30' },
      null,
      now,
    ),
  ).toMatchObject({
    success: true,
    data: { published_at: '2030-06-02T13:30:00.000Z', is_published: true },
  })
})
it.each(['', 'not-a-date', '2020-01-01T10:30'])(
  'rejects a missing, invalid or past schedule: %s',
  (date) => {
    expect(
      validateNewsEditor(
        { ...values, publication: 'scheduled', published_at: date },
        null,
        now,
      ),
    ).toMatchObject({
      success: false,
      errors: {
        published_at:
          'Elegí una fecha y hora futuras para programar la noticia.',
      },
    })
  },
)
it('keeps seconds and milliseconds when the existing schedule has not changed', () => {
  const row = { ...published, published_at: '2099-01-01T13:30:42.123Z' }
  expect(validateNewsEditor(initialNewsValues(row), row, now)).toMatchObject({
    success: true,
    data: { published_at: row.published_at },
  })
})
it('returns field errors and blocks unsafe image URLs', () => {
  expect(
    validateNewsEditor(
      {
        ...values,
        title: '',
        excerpt: '',
        image_alt: '',
        image_url: 'http://example.test/image.png',
      },
      null,
      now,
    ),
  ).toMatchObject({
    success: false,
    errors: {
      title: 'Escribí un título para la noticia.',
      excerpt: 'Completá el texto de la noticia.',
      image_alt: 'Describí brevemente qué se ve en la imagen.',
      image_url:
        'Subí una imagen o ingresá un enlace HTTPS válido de hasta 2048 caracteres.',
    },
  })
  for (const url of [
    'javascript:alert(1)',
    'https://user:password@example.test/image.png',
    'not-a-url',
  ])
    expect(safeNewsImage(url)).toBeNull()
})
