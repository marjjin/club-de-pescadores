export type Tournament = {
  id: string
  name: string
  place: string | null
  startsOn: string
  endsOn: string | null
  /** Only loaded on the tournament page. */
  description: string | null
  finished: boolean
}

export type Standing = {
  id: string
  name: string
  points: number
  ranking: number
}

export type AnnualTableSummary = {
  id: string
  name: string
  year: number
  /** Finished tournaments already adding to it. */
  finished: number
}

export type AnnualTable = {
  id: string
  name: string
  year: number
  categories: { id: string; name: string }[]
  tournaments: {
    id: string
    name: string
    startsOn: string
    finished: boolean
  }[]
}

export type AnnualStanding = {
  name: string
  points: number
  tournaments: number
  ranking: number
}
