import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useFocusTrap(
  container: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const links = container.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      const elements = [trigger.current, ...Array.from(links ?? [])].filter(
        (element): element is HTMLElement => element !== null,
      )
      const first = elements[0]
      const last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [container, trigger, enabled])
}
