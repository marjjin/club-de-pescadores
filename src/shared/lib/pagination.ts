export type ListRequest = {
  limit?: number
  signal?: AbortSignal | undefined
}

export type ListPage<T, Cursor> = {
  items: T[]
  nextCursor: Cursor | null
}

export const MAX_PAGE_SIZE = 50

export function getPageSize(limit = 3): number {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new RangeError(
      `Page size must be an integer between 1 and ${MAX_PAGE_SIZE}`,
    )
  }
  return limit
}
