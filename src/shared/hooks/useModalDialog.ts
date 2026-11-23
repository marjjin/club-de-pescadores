import { useCallback, useEffect, useRef } from 'react'
import type { SyntheticEvent } from 'react'

// Longest exit transition in index.css plus margin: infinite animations inside the
// dialog (skeletons, spinners) never settle, so the close never waits longer than this.
const EXIT_TIMEOUT = 400

/**
 * Drives a native modal <dialog> from React state with an animated exit.
 *
 * The browser closes a dialog instantly, so every close request (Esc, back gesture,
 * click outside, our own buttons) goes through `requestClose`: it marks the dialog
 * `data-closing`, lets the CSS exit transition run and only then calls `close()`.
 * `onClose` fires once the dialog is really closed.
 */
export function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeHandler = useRef(onClose)
  const closing = useRef(false)
  // Set when we closed it ourselves, so the native close event does not repeat onClose.
  const handled = useRef(false)

  useEffect(() => {
    closeHandler.current = onClose
  }, [onClose])

  const requestClose = useCallback(() => {
    const dialog = ref.current
    if (!dialog?.open || closing.current) return
    closing.current = true
    const finish = () => {
      dialog.removeAttribute('data-closing')
      closing.current = false
      handled.current = true
      dialog.close()
      closeHandler.current()
    }
    dialog.setAttribute('data-closing', '')
    const animations = dialog.getAnimations({ subtree: true })
    if (!animations.length) {
      finish()
      return
    }
    void Promise.race([
      Promise.allSettled(animations.map((animation) => animation.finished)),
      new Promise((resolve) => setTimeout(resolve, EXIT_TIMEOUT)),
    ]).then(finish)
  }, [])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      handled.current = false
      dialog.showModal()
      // React turns autoFocus into a focus() call at mount, when this dialog may
      // still be closed, so the initial focus is marked with data-autofocus instead.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) requestClose()
  }, [open, requestClose])

  // Light dismiss for browsers without `closedby` (Safari): a press and release
  // outside the dialog box. Both ends count, so a text selection dragged out does not close it.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return
    const outside = (event: PointerEvent) => {
      const box = dialog.getBoundingClientRect()
      return (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
    }
    let pressedOutside = false
    const down = (event: PointerEvent) => {
      pressedOutside = outside(event)
    }
    const up = (event: PointerEvent) => {
      if (pressedOutside && outside(event)) requestClose()
    }
    dialog.addEventListener('pointerdown', down)
    dialog.addEventListener('pointerup', up)
    return () => {
      dialog.removeEventListener('pointerdown', down)
      dialog.removeEventListener('pointerup', up)
    }
  }, [requestClose])

  const dialogProps = {
    ref,
    // Not in React's types yet; the browser reads it as a plain attribute.
    ...({ closedby: 'any' } as object),
    onCancel: (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault()
      requestClose()
    },
    // Browsers may force-close after repeated Esc presses without waiting for us.
    onClose: () => {
      if (handled.current) {
        handled.current = false
        return
      }
      closing.current = false
      closeHandler.current()
    },
  }

  return { ref, requestClose, dialogProps }
}
