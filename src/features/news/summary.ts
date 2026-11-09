export function summarizeNews(text: string, limit = 160): string {
  const normalized = text.replace(/\s+/gu, ' ').trim()
  const characters = Array.from(normalized)
  if (characters.length <= limit) return normalized
  const prefix = characters.slice(0, limit).join('')
  const boundary = prefix.lastIndexOf(' ')
  return `${(boundary > prefix.length * 0.6 ? prefix.slice(0, boundary) : prefix).trimEnd()}…`
}
