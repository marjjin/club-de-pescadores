export const DEFAULT_IMAGES = ['pier', 'hall', 'grill', 'river'] as const
export type DefaultImage = (typeof DEFAULT_IMAGES)[number]

export type Facility = {
  id: string
  name: string
  description: string
  imageUrl: string
  imageAlt: string
}
export type FacilitiesContent = {
  title: string
  description: string
  cards: Facility[]
}
