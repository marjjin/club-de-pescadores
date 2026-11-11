// Mirrors AdminWorkspace's layout while the session is verified on reload, so the
// panel does not flash the login screen's split layout before appearing.
export function AdminShellSkeleton() {
  return (
    <div className="min-h-dvh bg-mist-50 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <span role="status" className="sr-only">
        Abriendo el panel…
      </span>
      <aside
        aria-hidden="true"
        className="hidden bg-navy-950 p-5 lg:sticky lg:top-0 lg:block lg:h-dvh"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="size-12 rounded-full bg-white/10" />
          <div className="h-3 w-28 rounded bg-white/10" />
        </div>
        <div className="grid gap-3 motion-safe:animate-pulse">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="h-9 rounded-lg bg-white/5" />
          ))}
        </div>
      </aside>
      <div aria-hidden="true" className="min-w-0">
        <div className="flex h-[4.25rem] items-center gap-3 border-b border-navy-900/10 bg-white px-4 sm:px-6 lg:px-9">
          <div className="size-11 rounded-lg bg-mist-50 lg:hidden" />
          <div className="h-3 w-44 rounded bg-mist-50" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-6 p-5 motion-safe:animate-pulse sm:p-7 lg:p-9">
          <div className="h-8 w-64 max-w-full rounded bg-navy-900/10" />
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="h-40 rounded-2xl bg-white shadow-sm" />
            <div className="h-40 rounded-2xl bg-white shadow-sm" />
          </div>
          <div className="h-64 rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    </div>
  )
}
