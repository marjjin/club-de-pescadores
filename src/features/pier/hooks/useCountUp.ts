import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 1400
// Waits for the pier card's own entrance (index.css, .reveal-card) to get going.
const DELAY_MS = 450

const easeOutQuart = (t: number) => 1 - (1 - t) ** 4

/**
 * Counts from zero up to `target` once the element scrolls into view. Until then,
 * and wherever motion is reduced or IntersectionObserver is missing, it returns the
 * target itself, so the real value is what renders first and what a reader gets.
 */
export function useCountUp<T extends Element>(target: number) {
  const ref = useRef<T>(null)
  // Share of the count done; null when not counting, which shows the target itself.
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (
      !element ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
      return

    let frame = 0
    let timer = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      setProgress(0)
      timer = window.setTimeout(() => {
        const start = performance.now()
        const tick = (now: number) => {
          const done = Math.min((now - start) / DURATION_MS, 1)
          setProgress(done < 1 ? done : null)
          if (done < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      }, DELAY_MS)
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [target])

  const value = progress === null ? target : target * easeOutQuart(progress)
  return { ref, value }
}
