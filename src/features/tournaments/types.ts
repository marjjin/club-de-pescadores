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
