export function CatalogListSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="grid gap-4 p-6 motion-safe:animate-pulse"
    >
      <span className="sr-only">{label}…</span>
      {[1, 2, 3].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="flex items-center gap-4 py-3"
        >
          <span className="size-11 rounded-xl bg-mist-50" />
          <div className="grid flex-1 gap-3">
            <span className="h-4 w-2/3 rounded bg-mist-50" />
            <span className="h-3 w-1/3 rounded bg-mist-50" />
          </div>
        </div>
      ))}
    </div>
  )
}
