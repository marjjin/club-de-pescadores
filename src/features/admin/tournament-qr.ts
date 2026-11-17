import { encode, renderSVG } from 'uqr'

/**
 * Public leaderboard address printed in the QR. It uses the canonical site URL, not
 * the address the panel is open on: a QR printed from localhost would lead nowhere.
 */
export function tournamentPublicUrl(
  id: string,
  site = import.meta.env.VITE_SITE_URL ?? window.location.origin,
) {
  return `${new URL(site).origin}/torneos/${encodeURIComponent(id)}`
}

// "M" survives a crease or a smudge on a printed sheet without making the code dense.
const options = { ecc: 'M', border: 0 } as const

/** Dark modules as one SVG path, so React renders it without injecting markup. */
export function qrPath(text: string) {
  const { data, size } = encode(text, options)
  let d = ''
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) d += `M${x} ${y}h1v1h-1z`
    }),
  )
  return { d, size }
}

/** Standalone file for flyers or social media; keeps the quiet zone scanners need. */
export const qrSvgFile = (text: string) =>
  renderSVG(text, { ecc: 'M', border: 4, pixelSize: 16 })
