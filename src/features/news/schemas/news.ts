import { z } from '@/shared/lib/validation'

export const newsRowSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(180),
  excerpt: z.string().trim().min(1).max(1200),
  published_at: z.iso.datetime({ offset: true }),
  image_url: z.url({ protocol: /^https$/ }).max(2048),
  image_alt: z.string().trim().min(1).max(300),
  image_focus_x: z.number().int().min(0).max(100),
  image_focus_y: z.number().int().min(0).max(100),
})

export const newsCursorSchema = z.object({
  publishedAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
})
export type NewsCursor = z.infer<typeof newsCursorSchema>
