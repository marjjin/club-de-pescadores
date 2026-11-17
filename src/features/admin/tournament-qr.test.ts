import { encode } from 'uqr'
import { expect, it } from 'vitest'
import { qrPath, qrSvgFile, tournamentPublicUrl } from './tournament-qr'

const id = '60000000-0000-4000-8000-000000000001'

it('points to the public leaderboard on the canonical site, never the panel origin', () => {
  expect(tournamentPublicUrl(id, 'https://www.clubdepescadores.com/')).toBe(
    `https://www.clubdepescadores.com/torneos/${id}`,
  )
  // A path or trailing slash in the setting does not leak into the printed link.
  expect(
    tournamentPublicUrl(id, 'https://www.clubdepescadores.com/admin'),
  ).toBe(`https://www.clubdepescadores.com/torneos/${id}`)
})

it('draws one square per dark module, including the three finder patterns', () => {
  const url = tournamentPublicUrl(id, 'https://www.clubdepescadores.com')
  const { data, size } = encode(url, { ecc: 'M', border: 0 })
  const { d, size: drawn } = qrPath(url)
  expect(drawn).toBe(size)
  const dark = data.flat().filter(Boolean).length
  expect(d.match(/M/g)).toHaveLength(dark)
  // Finder patterns: solid 7×7 frames in three corners.
  for (const [x, y] of [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ] as const)
    expect(data[y]?.slice(x, x + 7).every(Boolean)).toBe(true)
  expect(qrPath(`${url}x`).d).not.toBe(d)
})

it('exports a standalone SVG file for flyers', () => {
  expect(qrSvgFile('https://www.clubdepescadores.com/torneos/x')).toMatch(
    /^<svg[\s\S]*<\/svg>$/,
  )
})
