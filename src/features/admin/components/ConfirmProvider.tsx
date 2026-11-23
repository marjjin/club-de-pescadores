import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Modal } from '@/shared/ui/Modal'
import { ConfirmContext } from '../hooks/useConfirm'
import type { Confirm, ConfirmOptions } from '../hooks/useConfirm'
import { primaryClass, secondaryClass } from './ui'

type Pending = ConfirmOptions & { resolve: (value: boolean) => void }

const dangerClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-5 text-sm font-bold text-white hover:bg-red-800'

export function ConfirmProvider({ children }: { children: ReactNode }) {
  // The question stays rendered while the window animates out, so `open` is separate.
  const [pending, setPending] = useState<Pending | null>(null)
  const [open, setOpen] = useState(false)
  const answered = useRef(false)
  const confirm = useCallback<Confirm>(
    (options) =>
      new Promise<boolean>((resolve) => {
        answered.current = false
        setPending({
          ...(typeof options === 'string' ? { title: options } : options),
          resolve,
        })
        setOpen(true)
      }),
    [],
  )
  function answer(value: boolean) {
    if (answered.current) return
    answered.current = true
    pending?.resolve(value)
  }
  const danger = pending?.tone === 'danger'
  const Icon = danger ? AlertTriangle : HelpCircle
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={open}
        // Esc, the back gesture and a click outside count as "cancel".
        onClose={() => {
          answer(false)
          setOpen(false)
          setPending(null)
        }}
        size="sm"
        title={pending?.title}
        description={pending?.message}
        icon={<Icon size={20} />}
        iconTone={danger ? 'danger' : 'river'}
        className="[&>header]:border-0 [&>footer]:border-0 [&>footer]:pt-2"
        footer={(close) => (
          <>
            <button
              type="button"
              data-autofocus={danger || undefined}
              onClick={() => {
                answer(false)
                close()
              }}
              className={secondaryClass}
            >
              {pending?.cancelLabel ?? 'Cancelar'}
            </button>
            <button
              type="button"
              data-autofocus={!danger || undefined}
              onClick={() => {
                answer(true)
                close()
              }}
              className={danger ? dangerClass : primaryClass}
            >
              {pending?.confirmLabel ?? 'Confirmar'}
            </button>
          </>
        )}
      />
    </ConfirmContext.Provider>
  )
}
