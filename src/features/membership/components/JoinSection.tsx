import { MessageCircle } from 'lucide-react'
import { club } from '@/shared/config/club'
import { button } from '@/shared/ui/button'
import { container } from '@/shared/ui/layout'
import { ExternalLink } from '@/shared/ui/ExternalLink'

// Club yellow (the façade colour) so it reads as the closing call and does not merge with the navy footer.
export function JoinSection() {
  return (
    <section id="sumate" className="bg-sun-400 py-14 lg:py-20">
      <div
        className={`${container} flex flex-col gap-6 text-navy-950 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div>
          <h2 className="reveal-text font-display text-4xl leading-none tracking-wide uppercase sm:text-6xl">
            Sumate al club
          </h2>
          <p className="reveal-text mt-3 text-lg font-semibold text-navy-950/80">
            La pesca nos une, la naturaleza nos inspira.
          </p>
        </div>
        <ExternalLink
          href={club.whatsappUrl}
          className={`reveal-text ${button.secondary} shrink-0`}
        >
          <MessageCircle aria-hidden="true" className="size-5" />
          Hacete socio
        </ExternalLink>
      </div>
    </section>
  )
}
