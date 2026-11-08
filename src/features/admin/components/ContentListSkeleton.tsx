export function ContentListSkeleton() {
  return (
    <div role="status" className="divide-y divide-navy-900/10">
      <span className="sr-only">Cargando contenido…</span>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="flex gap-4 px-4 py-6 motion-safe:animate-pulse sm:px-6"
        >
          <div className="hidden size-20 rounded-xl bg-mist-50 sm:block" />
          <div className="grid flex-1 gap-3 py-1">
            <div className="h-3 w-24 rounded bg-navy-900/5" />
            <div className="h-4 w-2/3 rounded bg-navy-900/10" />
            <div className="h-3 w-4/5 rounded bg-navy-900/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
