import { useEffect, useState } from 'react'
import { clearDraft, readDraft, writeDraft } from '@/shared/lib/drafts'
import { z } from '@/shared/lib/validation'

type Primitive = string | number | boolean | null
const draftSchema = z.object({
  // The record's updated_at when the draft was taken; null for new records.
  version: z.string().nullable(),
  values: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
  extra: z.unknown().optional(),
})

/**
 * Restores a form draft once, only if the record did not change since it was taken,
 * so a stale draft never overwrites someone else's edit. Each field is accepted only
 * when it keeps the type of the current value: storage content is untrusted.
 */
export function useRestoredDraft<T extends Record<string, Primitive>>(
  key: string,
  version: string | null,
  initial: T,
) {
  const [restored] = useState(() => {
    const draft = readDraft(key, draftSchema)
    if (!draft || draft.data.version !== version) return null
    const values = { ...initial }
    for (const name of Object.keys(initial) as (keyof T)[]) {
      const saved = draft.data.values[name as string]
      const current = initial[name]
      if (
        saved !== undefined &&
        (typeof saved === typeof current || saved === null || current === null)
      )
        values[name] = saved as T[keyof T]
    }
    return { values, extra: draft.data.extra, savedAt: draft.savedAt }
  })
  return restored
}

/** Saves the form while it has changes and clears the draft when it has none. */
export function useDraftSync(
  key: string,
  version: string | null,
  values: Record<string, Primitive>,
  dirty: boolean,
  extra?: unknown,
) {
  const snapshot = JSON.stringify({ version, values, extra })
  useEffect(() => {
    if (!dirty) {
      clearDraft(key)
      return
    }
    // Debounced so typing does not hit storage on every keystroke.
    const timer = window.setTimeout(
      () => writeDraft(key, JSON.parse(snapshot)),
      400,
    )
    return () => window.clearTimeout(timer)
  }, [key, snapshot, dirty])
}

export { clearDraft }
