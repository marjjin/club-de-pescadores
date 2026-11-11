import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { ConfirmContext } from '../hooks/useConfirm'
import type { Confirm, ConfirmOptions } from '../hooks/useConfirm'
import { primaryClass, secondaryClass } from './ui'

type Pending = ConfirmOptions & { resolve: (value: boolean) => void }

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const confirm = useCallback<Confirm>(
    (options) =>
      new Promise<boolean>((resolve) =>
        setPending({
          ...(typeof options === 'string' ? { title: options } : options),
          resolve,
        }),
      ),
    [],
  )
  useEffect(() => {
    if (pending && !dialog.current?.open) dialog.current?.showModal()
  }, [pending])
  function settle(value: boolean) {
    pending?.resolve(value)
    setPending(null)
    dialog.current?.close()
  }
  const danger = pending?.tone === 'danger'
  const Icon = danger ? AlertTriangle : HelpCircle
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        aria-describedby={pending?.message ? 'confirm-message' : undefined}
        // Esc and the backdrop count as "cancel", like the native dialog.
        onCancel={(event) => {
          event.preventDefault()
          settle(false)
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) settle(false)
        }}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-navy-950/50 backdrop:backdrop-blur-[2px]"
      >
        {pending && (
          <div className="p-6">
            <div className="flex gap-4">
              <span
                aria-hidden="true"
                className={`grid size-11 shrink-0 place-items-center rounded-full ${danger ? 'bg-red-50 text-red-700' : 'bg-mist-50 text-river-600'}`}
              >
                <Icon size={22} />
              </span>
              <div className="min-w-0">
                <h2
                  id="confirm-title"
                  className="text-lg leading-snug font-extrabold text-navy-900"
                >
                  {pending.title}
                </h2>
                {pending.message && (
                  <p
                    id="confirm-message"
                    className="mt-2 text-sm leading-6 text-ink-600"
                  >
                    {pending.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus={danger}
                onClick={() => settle(false)}
                className={secondaryClass}
              >
                {pending.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                type="button"
                autoFocus={!danger}
                onClick={() => settle(true)}
                className={
                  danger
                    ? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-5 text-sm font-bold text-white hover:bg-red-800'
                    : primaryClass
                }
              >
                {pending.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  )
}
