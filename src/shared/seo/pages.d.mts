export declare const SITE_NAME: string
export declare const SITE_LOCALE: string
export declare const CLUB: {
  readonly name: string
  readonly street: string
  readonly postalCode: string
  readonly locality: string
  readonly region: string
  readonly country: string
  readonly telephone: string
  readonly whatsapp: string
  readonly openAllDay: boolean
  readonly profiles: readonly string[]
}
export type PageMeta = {
  readonly path: string
  readonly title: string
  readonly description: string
}
export declare const PAGES: {
  readonly home: PageMeta
  readonly news: PageMeta
  readonly events: PageMeta
  readonly tournaments: PageMeta
  readonly privacy: PageMeta
  readonly notFound: PageMeta
}
export declare function pageTitle(name: string | null | undefined): string
export declare function clip(
  text: string | null | undefined,
  max?: number,
): string
export declare function tournamentDescription(tournament: {
  name: string
  description: string | null
}): string
export declare function annualTableTitle(table: {
  name: string
  year: number
}): string
export declare function annualTableDescription(table: {
  name: string
  year: number
}): string
