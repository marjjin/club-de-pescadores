import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonClass } from './button'

type Props = {
  label: string
  canPrevious: boolean
  canNext: boolean
  onPrevious: () => void
  onNext: () => void
  busyMessage?: string | undefined
}

// Shared by the public archives; the state logic stays in each feature's hook.
export function PagerNav({
  label,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  busyMessage,
}: Props) {
  return (
    <>
      <nav
        aria-label={label}
        className="mt-10 flex items-center justify-between gap-4 border-t border-navy-900/10 pt-6 sm:justify-start"
      >
        <button
          type="button"
          disabled={!canPrevious}
          onClick={onPrevious}
          className={buttonClass('outline')}
        >
          <ChevronLeft size={18} aria-hidden="true" />
          Anterior
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className={buttonClass('outline')}
        >
          Siguiente
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </nav>
      {busyMessage && (
        <p role="status" className="mt-4 text-sm text-ink-600">
          {busyMessage}
        </p>
      )}
    </>
  )
}
