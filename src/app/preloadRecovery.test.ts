import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { installPreloadRecovery } from './preloadRecovery'

const cleanups: (() => void)[] = []
const fail = () => {
  const event = new Event('vite:preloadError', { cancelable: true })
  window.dispatchEvent(event)
  return event
}
beforeEach(() => {
  sessionStorage.clear()
  vi.stubGlobal('navigator', { onLine: true })
})
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  sessionStorage.clear()
})

it('reloads on a failed lazy import without changing the current URL', () => {
  const reload = vi.fn()
  const currentUrl = window.location.href
  cleanups.push(installPreloadRecovery(reload))
  expect(fail().defaultPrevented).toBe(true)
  expect(reload).toHaveBeenCalledOnce()
  expect(window.location.href).toBe(currentUrl)
})
it('preserves the loop guard across page initializations and allows a later retry', () => {
  const reload = vi.fn()
  vi.spyOn(Date, 'now').mockReturnValue(100_000)
  const firstCleanup = installPreloadRecovery(reload)
  fail()
  firstCleanup()
  cleanups.push(installPreloadRecovery(reload))
  expect(fail().defaultPrevented).toBe(false)
  expect(reload).toHaveBeenCalledOnce()
  vi.mocked(Date.now).mockReturnValue(161_000)
  fail()
  expect(reload).toHaveBeenCalledTimes(2)
})
it('leaves the fallback available when offline', () => {
  vi.stubGlobal('navigator', { onLine: false })
  const reload = vi.fn()
  cleanups.push(installPreloadRecovery(reload))
  expect(fail().defaultPrevented).toBe(false)
  expect(reload).not.toHaveBeenCalled()
})
it('does not risk reload loops when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage disabled')
  })
  const reload = vi.fn()
  cleanups.push(installPreloadRecovery(reload))
  expect(fail().defaultPrevented).toBe(false)
  expect(reload).not.toHaveBeenCalled()
})
