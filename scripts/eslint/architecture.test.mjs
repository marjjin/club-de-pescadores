// @vitest-environment node
import path from 'node:path'
import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { architectureRule } from './architecture.mjs'

function lint(filename, code) {
  return new Linter().verify(
    code,
    [
      {
        files: ['**/*.{js,ts,tsx}'],
        languageOptions: { parser: tseslint.parser },
        plugins: { architecture: { rules: { boundaries: architectureRule } } },
        rules: { 'architecture/boundaries': 'error' },
      },
    ],
    { filename: path.resolve(filename) },
  )
}

describe('architecture boundaries', () => {
  it.each([
    ['src/app/routes.js', "import('@/pages/home')"],
    ['src/main.js', "import '@/app/App'"],
    ['src/pages/home/Page.js', "import { NewsSection } from '@/features/news'"],
    [
      'src/features/events/components/Section.js',
      "import { useEvents } from '../hooks/useEvents'",
    ],
    [
      'src/features/events/api/events.js',
      "import { client } from '@/lib/supabase/client'",
    ],
    [
      'src/features/events/api/events.js',
      "export { newsKeys } from '@/features/news/index.ts'",
    ],
    ['src/shared/ui/Button.js', "import { formatDate } from '../lib/dates'"],
  ])('allows the intended dependency flow from %s', (filename, code) => {
    expect(lint(filename, code)).toEqual([])
  })

  it.each([
    ['src/shared/ui/Button.js', "import '@/features/news'"],
    ['src/main.js', "import '@/features/news'"],
    [
      'src/features/events/types.ts',
      "type Other = import('../../news/types').NewsItem",
    ],
    ['src/features/events/components/Section.js', "import '@/app/Providers'"],
    [
      'src/features/events/components/Section.js',
      "import '../../news/components/NewsSection'",
    ],
    ['src/app/routes.js', "import('@/pages/home/HomePage')"],
    [
      'src/app/App.js',
      "export * from '@/features/news/components/NewsSection'",
    ],
    [
      'src/features/events/components/Section.js',
      "import '../api/getUpcomingEvents'",
    ],
    ['src/features/events/components/Section.js', "import('../data/events')"],
    ['src/features/events/hooks/useEvents.js', "import '../data.ts'"],
    ['src/features/events/api/events.js', "import '../hooks/useEvents'"],
    [
      'src/features/events/components/Section.js',
      "import { client } from '@/lib/supabase/client'",
    ],
    [
      'src/features/events/components/Section.js',
      "import { createClient } from '@supabase/supabase-js'",
    ],
    ['src/features/events/hooks/useEvents.js', "fetch('/api/events')"],
    ['src/lib/query/client.js', "import '@/shared/ui/QueryBoundary'"],
  ])('rejects a forbidden dependency from %s', (filename, code) => {
    const errors = lint(filename, code)
    expect(errors).toHaveLength(1)
    expect(errors[0]?.ruleId).toBe('architecture/boundaries')
  })
})
