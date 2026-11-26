import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/**
 * Plays the section's entrance once it scrolls into view. The section itself stays
 * put (its background shows at once); the heading and items marked with the
 * reveal-* classes animate in. Choreography and reduced motion live in index.css.
 * Below the fold only: the hero must not delay its first paint.
 */
export function Reveal({ children }: Props) {
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
      { rootMargin: '0px 0px -15% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} data-reveal={isVisible ? 'shown' : 'pending'}>
      {children}
    </div>
  )
}
