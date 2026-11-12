const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-bold whitespace-nowrap transition-[color,background-color,border-color,scale] duration-200 not-disabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none'

const sizes = {
  md: 'min-h-12 px-6',
  sm: 'min-h-11 px-4 text-sm',
}

// One primary action per view; the rest use secondary, outline or link styles.
const variants = {
  primary: 'bg-sun-400 text-navy-950 hover:bg-sun-300',
  secondary: 'bg-navy-900 text-white hover:bg-navy-800',
  outline:
    'border border-navy-900/20 bg-white text-navy-900 hover:border-navy-900/40 hover:bg-mist-50',
  outlineOnDark:
    'border border-white/70 text-white hover:bg-white hover:text-navy-900',
}

type Variant = keyof typeof variants

export const buttonClass = (
  variant: Variant,
  size: keyof typeof sizes = 'md',
) => `${base} ${sizes[size]} ${variants[variant]}`

export const button = {
  primary: buttonClass('primary'),
  secondary: buttonClass('secondary'),
  outline: buttonClass('outline'),
  outlineOnDark: buttonClass('outlineOnDark'),
}

export const textLink =
  'inline-flex min-h-11 items-center gap-2 font-bold text-river-600 underline-offset-4 hover:underline'
