import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * How the section's items enter: rising (default), sliding in from one side, or
 * settling from a slight zoom. Consecutive home sections alternate, so the page
 * does not repeat one move all the way down.
 */
export type RevealVariant = 'rise' | 'left' | 'right' | 'zoom'

type Props = {
  children: ReactNode
  variant?: RevealVariant
}

/**
 * Plays the section's entrance once it scrolls into view. The section itself stays
 * put (its background shows at once); the heading and items marked with the
 * reveal-* classes animate in. Choreography and reduced motion live in index.css.
 * Below the fold only: the hero must not delay its first paint.
 */
export function Reveal({ children, variant = 'rise' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setIsVisible(true)
        observer.disconnect()
      },
      // Starts as soon as the section peeks in, so it never pops in mid-screen.
      { rootMargin: '0px 0px -4% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal={isVisible ? 'shown' : 'pending'}
      data-reveal-variant={variant}
    >
      {children}
    </div>
  )
}
