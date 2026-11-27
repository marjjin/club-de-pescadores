import { formatRiverHeight } from '@/features/river'
import { useCountUp } from '../hooks/useCountUp'

type Props = { heightCm: number; className: string }

/** The day's river height, counting up to its value as the pier card comes in. */
export function RiverHeight({ heightCm, className }: Props) {
  const { ref, value } = useCountUp<HTMLParagraphElement>(heightCm)
  return (
    <p ref={ref} className={className}>
      {formatRiverHeight(Math.round(value))}
    </p>
  )
}
