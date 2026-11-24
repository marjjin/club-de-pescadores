import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useActiveSection } from './useActiveSection'

type Callback = (
  entries: { isIntersecting: boolean; target: Element }[],
) => void

let notify: Callback = () => {}

function setup() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: Callback) {
        notify = callback
      }
      observe() {}
      disconnect() {}
    },
  )
  for (const [id, top] of [
    ['noticias', 1000],
    ['contacto', 2000],
  ] as const) {
    const section = document.createElement('section')
    section.id = id
    Object.defineProperty(section, 'offsetTop', { value: top })
    document.body.append(section)
  }
}

function scrollTo(y: number, pageHeight: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: pageHeight,
  })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y })
  window.dispatchEvent(new Event('scroll'))
}

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

describe('useActiveSection', () => {
  it('follows the section crossing the center of the screen', () => {
    setup()
    const { result } = renderHook(() =>
      useActiveSection(['noticias', 'contacto']),
    )
    scrollTo(0, 5000)
    act(() =>
      notify([
        {
          isIntersecting: true,
          target: document.getElementById('noticias') as Element,
        },
      ]),
    )
    expect(result.current).toBe('noticias')
  })

  it('marks the last section at the bottom of the page', () => {
    setup()
    const { result } = renderHook(() =>
      useActiveSection(['noticias', 'contacto']),
    )
    act(() => scrollTo(5000 - window.innerHeight, 5000))
    expect(result.current).toBe('contacto')
    // A section passing the center while the page is still at the bottom does not win.
    act(() =>
      notify([
        {
          isIntersecting: true,
          target: document.getElementById('noticias') as Element,
        },
      ]),
    )
    expect(result.current).toBe('contacto')
  })
})
