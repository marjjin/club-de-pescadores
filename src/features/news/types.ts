export type NewsItem = {
  id: string
  title: string
  excerpt: string
  publishedOn: string
  imageUrl: string
  imageAlt: string
  /** CSS object-position for cropped covers, e.g. "50% 50%". */
  imagePosition: string
}
