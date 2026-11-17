import { useMemo } from 'react'
import { qrPath } from '../../tournament-qr'

// Scanners need a light margin of four modules around the code.
const QUIET = 4

export function QrCode({
  value,
  label,
  className = '',
}: {
  value: string
  label: string
  className?: string
}) {
  const { d, size } = useMemo(() => qrPath(value), [value])
  const total = size + QUIET * 2
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-QUIET} ${-QUIET} ${total} ${total}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect x={-QUIET} y={-QUIET} width={total} height={total} fill="#fff" />
      <path d={d} fill="#0b1a33" />
    </svg>
  )
}
