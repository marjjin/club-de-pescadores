import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { container } from '@/shared/ui/layout'

const tabs = [
  { id: 'tabla', label: 'Tabla de posiciones' },
  { id: 'info', label: 'Información' },
] as const
type Tab = (typeof tabs)[number]['id']

/**
 * Leaderboard and description as two sections. The leaderboard opens first because
 * that is what the printed QR promises; "?seccion=info" links straight to the details.
 */
export function TournamentTabs({
  board,
  info,
}: {
  board: ReactNode
  info: ReactNode
}) {
  const [params, setParams] = useSearchParams()
  const active: Tab = params.get('seccion') === 'info' ? 'info' : 'tabla'
  const refs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  function select(tab: Tab) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (tab === 'tabla') next.delete('seccion')
        else next.set('seccion', tab)
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === active)
    const target =
      event.key === 'ArrowRight'
        ? tabs[(index + 1) % tabs.length]
        : event.key === 'ArrowLeft'
          ? tabs[(index - 1 + tabs.length) % tabs.length]
          : event.key === 'Home'
            ? tabs[0]
            : event.key === 'End'
              ? tabs[tabs.length - 1]
              : undefined
    if (!target) return
    event.preventDefault()
    select(target.id)
    refs.current[target.id]?.focus()
  }
  return (
    <>
      <div className="border-b border-navy-900/10 bg-white">
        <div
          role="tablist"
          aria-label="Secciones del torneo"
          onKeyDown={onKeyDown}
          className={`${container} flex max-w-3xl gap-1`}
        >
          {tabs.map((tab) => {
            const selected = tab.id === active
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  refs.current[tab.id] = element
                }}
                type="button"
                role="tab"
                id={`tournament-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`tournament-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(tab.id)}
                className={`-mb-px min-h-12 flex-1 border-b-[3px] px-3 text-sm font-bold transition-colors sm:flex-none sm:px-5 sm:text-base ${selected ? 'border-sun-400 text-navy-900' : 'border-transparent text-ink-600 hover:text-navy-900'}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`tournament-panel-${tab.id}`}
          aria-labelledby={`tournament-tab-${tab.id}`}
          // Hidden, not unmounted: the chosen category survives a look at the details.
          hidden={tab.id !== active}
        >
          {tab.id === 'tabla' ? board : info}
        </div>
      ))}
    </>
  )
}
