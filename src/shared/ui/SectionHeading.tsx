type Props = {
  title: string
  description?: string
  inverted?: boolean
}

export function SectionHeading({
  title,
  description,
  inverted = false,
}: Props) {
  return (
    <div className="max-w-2xl">
      <h2
        className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${
          inverted ? 'text-white' : 'text-navy-900'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-2 text-lg ${
            inverted ? 'text-white/80' : 'text-ink-600'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  )
}
