import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { container } from './layout'
import { SectionHeading } from './SectionHeading'

type Props = {
  title: string
  description?: string | undefined
}

export function PageHeader({ title, description }: Props) {
  return (
    <header className="border-b border-navy-900/5 bg-mist-50">
      <div className={`${container} pt-6 pb-10 sm:pb-14`}>
        <nav aria-label="Ubicación" className="mb-6 text-sm sm:mb-8">
          <ol className="flex items-center gap-1.5 text-ink-600">
            <li>
              <Link
                to="/"
                className="inline-flex min-h-11 items-center font-semibold hover:text-river-600 hover:underline"
              >
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} />
            </li>
            <li aria-current="page" className="font-semibold text-navy-900">
              {title}
            </li>
          </ol>
        </nav>
        <SectionHeading as="h1" title={title} description={description} />
      </div>
    </header>
  )
}
