export function requestSignal(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(12_000)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}
