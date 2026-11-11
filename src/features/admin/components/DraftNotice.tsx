import { History } from 'lucide-react'
import { formatRelative } from '@/shared/lib/dates'

export function DraftNotice({
  savedAt,
  onDiscard,
}: {
  savedAt: string
  onDiscard: () => void
}) {
  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
    >
      <History size={18} aria-hidden="true" className="shrink-0" />
      <p className="min-w-0 flex-1">
        <span className="font-bold">Recuperamos tu borrador</span> guardado{' '}
        {formatRelative(savedAt)}. Seguí desde donde lo dejaste.
      </p>
      <button
        type="button"
        onClick={onDiscard}
        className="min-h-10 rounded-lg px-2 font-bold underline-offset-2 hover:underline"
      >
        Empezar de cero
      </button>
    </div>
  )
}
