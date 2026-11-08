import { MessageCircle } from 'lucide-react'
import { club } from '@/shared/config/club'
import { button } from '@/shared/ui/button'

export function JoinSection() {
  return (
    <section id="sumate" className="bg-navy-950 py-16 lg:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-display text-4xl tracking-wide uppercase sm:text-5xl">
            Sumate al club
          </h2>
          <p className="mt-2 text-lg text-white/80">
            La pesca nos une, la naturaleza nos inspira.
          </p>
        </div>
        <a href={club.whatsappUrl} className={`${button.primary} shrink-0`}>
          <MessageCircle aria-hidden="true" className="size-5" />
          Hacete socio
        </a>
      </div>
    </section>
  )
}
