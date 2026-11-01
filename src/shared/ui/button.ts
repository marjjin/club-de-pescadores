const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 font-bold transition-[color,background-color,scale] duration-200 active:scale-[0.98] motion-reduce:transition-none'

export const button = {
  primary: `${base} bg-sun-400 text-navy-950 hover:bg-yellow-300`,
  outlineOnDark: `${base} border border-white/70 text-white hover:bg-white hover:text-navy-900`,
}
