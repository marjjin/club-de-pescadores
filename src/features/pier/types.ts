import type { GalleryItem } from '@/shared/ui/MediaGallery'

export type PierReport = {
  id: string
  heightCm: number
  measuredAt: string
  conditions: string | null
  media: GalleryItem[]
}
