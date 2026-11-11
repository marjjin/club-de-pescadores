import { createContext, useContext } from 'react'

export type ConfirmOptions = {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Destructive actions get a red button and keep focus on Cancel. */
  tone?: 'default' | 'danger'
}
export type Confirm = (options: ConfirmOptions | string) => Promise<boolean>

export const ConfirmContext = createContext<Confirm | null>(null)

/**
 * Club-styled replacement for window.confirm. Outside the panel provider (isolated
 * component renders) it falls back to the native dialog so behaviour stays defined.
 */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext)
  return (
    confirm ??
    ((options) =>
      Promise.resolve(
        window.confirm(
          typeof options === 'string'
            ? options
            : [options.title, options.message].filter(Boolean).join('\n\n'),
        ),
      ))
  )
}
