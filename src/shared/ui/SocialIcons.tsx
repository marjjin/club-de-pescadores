type Props = { className?: string }

export function FacebookIcon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7V12h3.1V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z"
      />
    </svg>
  )
}

export function InstagramIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function YoutubeIcon({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M23.5 6.8a3 3 0 0 0-2.1-2.1C19.5 4.2 12 4.2 12 4.2s-7.5 0-9.4.5A3 3 0 0 0 .5 6.8 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.2 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.2zM9.6 15.6V8.4l6.2 3.6z"
      />
    </svg>
  )
}
