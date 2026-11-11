/**
 * Quick phrases staff tap in the pier report, shared with the public block so both
 * sides read the same words. Tone says whether the option is good for fishing.
 */
export type ConditionTone = 'good' | 'warn' | 'bad'
export const conditionGroups = [
  {
    id: 'pesca',
    label: 'Pesca',
    options: ['Se puede pescar', 'No se puede pescar'],
  },
  {
    id: 'camalotes',
    label: 'Camalotes',
    options: ['Sin camalotes', 'Pocos camalotes', 'Muchos camalotes'],
  },
  { id: 'viento', label: 'Viento', options: ['Poco viento', 'Viento fuerte'] },
  { id: 'pique', label: 'Pique', options: ['Buen pique', 'Poco pique'] },
] as const
export type ConditionGroup = (typeof conditionGroups)[number]
export type ConditionPhrase = ConditionGroup['options'][number]

export const conditionTones: Record<ConditionPhrase, ConditionTone> = {
  'Se puede pescar': 'good',
  'No se puede pescar': 'bad',
  'Sin camalotes': 'good',
  'Pocos camalotes': 'warn',
  'Muchos camalotes': 'bad',
  'Poco viento': 'good',
  'Viento fuerte': 'warn',
  'Buen pique': 'good',
  'Poco pique': 'warn',
}

// Whole-phrase comparison: "no se puede pescar" must not match "se puede pescar".
export const conditionSegments = (text: string) =>
  text
    .split(/\s*[,.;]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
export const samePhrase = (left: string, right: string) =>
  left.localeCompare(right, 'es', { sensitivity: 'base' }) === 0
export const hasCondition = (text: string, phrase: string) =>
  conditionSegments(text).some((part) => samePhrase(part, phrase))

/** Splits a report's text into the chosen quick phrases and the staff's own notes. */
export function readConditions(text: string) {
  const parts = conditionSegments(text)
  const chosen = conditionGroups.flatMap((group) =>
    group.options
      .filter((option) => parts.some((part) => samePhrase(part, option)))
      .map((option) => ({
        group: group.id,
        label: option,
        tone: conditionTones[option],
      })),
  )
  const notes = parts.filter(
    (part) => !chosen.some((item) => samePhrase(item.label, part)),
  )
  return {
    fishing: chosen.find((item) => item.group === 'pesca') ?? null,
    others: chosen.filter((item) => item.group !== 'pesca'),
    notes: notes.length
      ? notes.join(', ').replace(/^./, (first) => first.toLocaleUpperCase('es'))
      : null,
  }
}
