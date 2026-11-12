import { MessageCircle } from 'lucide-react'
import { club } from '@/shared/config/club'
import { button } from '@/shared/ui/button'
import { container } from '@/shared/ui/layout'

// Club yellow (the façade colour) so it reads as the closing call and does not merge with the navy footer.
export function JoinSection() {
  return (
    <section id="sumate" className="bg-sun-400 py-14 lg:py-20">
      <div
        className={`${container} flex flex-col gap-6 text-navy-950 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div>
          <h2 className="font-display text-4xl leading-none tracking-wide uppercase sm:text-6xl">
            Sumate al club
          </h2>
          <p className="mt-3 text-lg font-semibold text-navy-950/80">
            La pesca nos une, la naturaleza nos inspira.
          </p>
        </div>
        <a href={club.whatsappUrl} className={`${button.secondary} shrink-0`}>
          <MessageCircle aria-hidden="true" className="size-5" />
          Hacete socio
        </a>
      </div>
    </section>
  )
}
