import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import * as pier from '../../api/pier'
import type { PierReport } from '../../schemas/pier'
import { PierHistory } from './PierHistory'

vi.mock('../../api/pier', () => ({
  listPierReports: vi.fn(),
  setPierReportPublished: vi.fn(),
  deletePierReport: vi.fn(),
}))

const userId = '10000000-0000-4000-8000-000000000010'
const report = (n: number, height: number, published = true): PierReport => ({
  id: `40000000-0000-4000-8000-00000000000${n}`,
  height_cm: height,
  measured_at: new Date(Date.now() - n * 3_600_000).toISOString(),
  conditions: null,
  is_published: published,
  created_at: new Date(Date.now() - n * 3_600_000).toISOString(),
  author_email: 'staff@example.test',
  media_count: n === 1 ? 2 : 0,
})
beforeEach(() => {
  vi.mocked(pier.listPierReports).mockResolvedValue([
    report(1, 340),
    report(2, 300),
  ])
  vi.mocked(pier.deletePierReport).mockResolvedValue(undefined)
})
function mount() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <PierHistory userId={userId} />
    </QueryClientProvider>,
  )
}

it('deletes a report only after confirming, warning when it is the one on the site', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
  mount()
  const [live] = await screen.findAllByRole('button', {
    name: /^Borrar el parte/,
  })
  fireEvent.click(live!)
  await waitFor(() => expect(confirm).toHaveBeenCalled())
  expect(String(confirm.mock.calls[0]?.[0])).toContain(
    'parte publicado anterior',
  )
  expect(pier.deletePierReport).not.toHaveBeenCalled()
  confirm.mockReturnValueOnce(true)
  fireEvent.click(live!)
  await waitFor(() =>
    expect(pier.deletePierReport).toHaveBeenCalledWith(report(1, 340).id),
  )
})

it('does not mention the site when deleting an older report', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount()
  const buttons = await screen.findAllByRole('button', {
    name: /^Borrar el parte/,
  })
  fireEvent.click(buttons[1]!)
  await waitFor(() => expect(confirm).toHaveBeenCalled())
  expect(String(confirm.mock.calls[0]?.[0])).not.toContain('anterior')
})
