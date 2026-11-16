// The podium stands out; everyone else gets a neutral position.
const medals: Record<number, string> = {
  1: 'bg-sun-400 text-navy-950',
  2: 'bg-slate-200 text-navy-900',
  3: 'bg-amber-700/80 text-white',
}

export function RankBadge({ ranking }: { ranking: number }) {
  return (
    <span
      aria-label={`Puesto ${ranking}`}
      className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold tabular-nums ${medals[ranking] ?? 'bg-mist-50 text-navy-900'}`}
    >
      {ranking}
    </span>
  )
}
