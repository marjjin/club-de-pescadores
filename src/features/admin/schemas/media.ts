import { z } from '@/shared/lib/validation'

const path = (extensions: string) =>
  z
    .string()
    .regex(new RegExp(`^[0-9a-f-]{36}/[0-9a-f-]{36}[.](${extensions})$`))
// Mirrors the media_items constraints so invalid files never reach the RPC.
export const mediaInputSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('image'),
    path: path('webp|jpg'),
    width: z.number().int().min(1).max(10000),
    height: z.number().int().min(1).max(10000),
    alt: z.string().trim().min(1).max(300),
  }),
  z.object({
    kind: z.literal('video'),
    path: path('mp4|webm|mov'),
    poster_path: path('webp|jpg'),
    width: z.number().int().min(1).max(10000),
    height: z.number().int().min(1).max(10000),
    alt: z.string().trim().min(1).max(300),
  }),
])
export type MediaInput = z.infer<typeof mediaInputSchema>
export const MAX_MEDIA = 10
export const MAX_VIDEOS = 3
export const mediaListSchema = z
  .array(mediaInputSchema)
  .max(MAX_MEDIA, `Podés sumar hasta ${MAX_MEDIA} archivos.`)
  .refine(
    (items) =>
      items.filter((item) => item.kind === 'video').length <= MAX_VIDEOS,
    `Podés sumar hasta ${MAX_VIDEOS} videos.`,
  )
