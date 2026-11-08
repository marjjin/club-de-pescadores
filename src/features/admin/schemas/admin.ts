import { z } from '@/shared/lib/validation'

export const contextSchema = z.object({
  active: z.boolean(),
  general: z.boolean(),
  aal2: z.boolean(),
})
const identity = {
  id: z.uuid(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
}
const content = {
  ...identity,
  is_published: z.boolean(),
  deleted_at: z.string().nullable(),
}
export const newsSchema = z.object({
  ...content,
  title: z.string(),
  excerpt: z.string(),
  image_url: z.url(),
  image_alt: z.string(),
  published_at: z.string(),
})
export const eventSchema = z.object({
  ...content,
  title: z.string(),
  starts_at: z.string(),
  place: z.string(),
})
export const rateSchema = z.object({
  ...content,
  season: z.string(),
  period: z.string(),
  family_price_cents: z.number().int(),
  individual_price_cents: z.number().int(),
  family_description: z.string(),
  discount_note: z.string().nullable(),
  valid_from: z.string(),
  valid_until: z.string().nullable(),
})
export const roleSchema = z.object({
  ...identity,
  name: z.string(),
  is_system: z.boolean(),
  permissions: z.array(z.string()),
})
export const accountSchema = z.object({
  ...identity,
  email: z.email(),
  active: z.boolean(),
  roles: z.array(z.uuid()),
})
export const auditSchema = z.object({
  id: z.uuid(),
  created_at: z.string(),
  actor_id: z.uuid().nullable(),
  actor_email: z.email().nullable(),
  action: z.string(),
  resource_id: z.string(),
  before_data: z.unknown(),
  after_data: z.unknown(),
})
export const permissionSchema = z.object({
  id: z.string(),
  label: z.string(),
  reserved: z.boolean(),
})
export const dashboardSchema = z.object({
  news: z.number(),
  events: z.number(),
  rates: z.number(),
  drafts: z.number(),
  users: z.number(),
})
export type AdminContext = z.infer<typeof contextSchema>
export type News = z.infer<typeof newsSchema>
export type ClubEvent = z.infer<typeof eventSchema>
export type Rate = z.infer<typeof rateSchema>
export type Content = News | ClubEvent | Rate
export type Role = z.infer<typeof roleSchema>
export type Account = z.infer<typeof accountSchema>
export type Audit = z.infer<typeof auditSchema>
export type ContentKind = 'news' | 'events' | 'pool_rates'
export type ListKind = ContentKind | 'roles' | 'users' | 'audit'
export type Cursor = { id: string; created_at: string }
export type ListFilter = {
  cursor: Cursor | null
  state: string
  search: string
}
export const listSchemas = {
  news: newsSchema,
  events: eventSchema,
  pool_rates: rateSchema,
  roles: roleSchema,
  users: accountSchema,
  audit: auditSchema,
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1, 'Completá este campo.')
    .max(max, `Máximo ${max} caracteres.`)
const date = z.iso.date('Ingresá una fecha válida.')
const instant = z.iso.datetime({
  offset: true,
  error: 'Ingresá una fecha y hora válidas.',
})
export const contentInputs = {
  news: z.object({
    title: text(180),
    excerpt: text(1200),
    published_at: instant,
    image_url: z
      .url()
      .max(2048)
      .refine(
        (value) => value.startsWith('https://'),
        'La imagen debe usar HTTPS.',
      ),
    image_alt: text(300),
    is_published: z.boolean(),
  }),
  events: z.object({
    title: text(180),
    starts_at: instant,
    place: text(200),
    is_published: z.boolean(),
  }),
  pool_rates: z
    .object({
      season: text(120),
      period: text(120),
      family_price_cents: z.number().int().min(0).max(2147483647),
      individual_price_cents: z.number().int().min(0).max(2147483647),
      family_description: text(300),
      discount_note: text(500).nullable(),
      valid_from: date,
      valid_until: date.nullable(),
      is_published: z.boolean(),
    })
    .refine(
      (value) => !value.valid_until || value.valid_until >= value.valid_from,
      {
        message: 'La fecha final debe ser posterior al inicio.',
        path: ['valid_until'],
      },
    ),
}
