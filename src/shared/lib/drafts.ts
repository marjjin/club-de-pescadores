import type { z } from '@/shared/lib/validation'

/**
 * Unsent form drafts kept on this device so a reload or a closed tab loses nothing.
 * Never use it for passwords or tokens; drafts are cleared on logout because club
 * computers may be shared.
 */
const PREFIX = 'club-draft:'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type Draft<T> = { data: T; savedAt: string }

function storage() {
  try {
    return window.localStorage
  } catch {
    // Private windows or blocked site data: drafts simply become unavailable.
    return null
  }
}

export function readDraft<T>(
  key: string,
  schema: z.ZodType<T>,
): Draft<T> | null {
  try {
    const raw = storage()?.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data?: unknown; savedAt?: unknown }
    const savedAt = typeof parsed.savedAt === 'string' ? parsed.savedAt : ''
    const age = Date.now() - Date.parse(savedAt)
    const data = schema.safeParse(parsed.data)
    if (!data.success || !(age >= 0 && age < MAX_AGE_MS)) {
      clearDraft(key)
      return null
    }
    return { data: data.data, savedAt }
  } catch {
    return null
  }
}

export function writeDraft(key: string, data: unknown) {
  try {
    storage()?.setItem(
      PREFIX + key,
      JSON.stringify({ data, savedAt: new Date().toISOString() }),
    )
  } catch {
    // Quota exceeded or storage blocked: the form keeps working without a draft.
  }
}

export function clearDraft(key: string) {
  try {
    storage()?.removeItem(PREFIX + key)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

/** Removes every draft on this device, e.g. on logout. */
export function clearAllDrafts() {
  const store = storage()
  if (!store) return
  try {
    for (const key of Object.keys(store))
      if (key.startsWith(PREFIX)) store.removeItem(key)
  } catch {
    // Storage became unavailable mid-way; remaining drafts expire in 7 days.
  }
}
