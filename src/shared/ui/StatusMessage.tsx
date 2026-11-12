import { CircleAlert, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  tone: 'empty' | 'error'
  children: ReactNode
  action?: ReactNode
}

export function StatusMessage({ tone, children, action }: Props) {
  const Icon = tone === 'error' ? CircleAlert : Inbox
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-navy-900/15 bg-white/60 p-6 sm:flex-row sm:items-center"
    >
      <span
        aria-hidden="true"
        className={`grid size-11 shrink-0 place-items-center rounded-full ${
          tone === 'error'
            ? 'bg-red-50 text-red-700'
            : 'bg-mist-100 text-river-600'
        }`}
      >
        <Icon size={22} />
      </span>
      <div className="min-w-0 flex-1 text-ink-600">{children}</div>
      {action}
    </div>
  )
}
