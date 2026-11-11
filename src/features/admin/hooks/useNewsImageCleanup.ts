import { useEffect } from 'react'
import { removeUnusedNewsImages } from '../api/images'

// Once per page load is enough: abandoned uploads are rare and wait 24 h anyway.
let cleaned = false
export function useNewsImageCleanup(enabled: boolean) {
  useEffect(() => {
    if (!enabled || cleaned) return
    cleaned = true
    void removeUnusedNewsImages()
  }, [enabled])
}
