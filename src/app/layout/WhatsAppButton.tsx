import { MessageCircle } from 'lucide-react'
import { club } from '@/shared/config/club'

export function WhatsAppButton() {
  return (
    <a
      href={club.whatsappUrl}
      aria-label="Escribinos por WhatsApp"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 grid size-14 place-items-center rounded-full bg-river-600 text-white shadow-card transition-[background-color,scale] duration-200 hover:scale-105 hover:bg-navy-800 motion-reduce:transition-none"
    >
      <MessageCircle aria-hidden="true" className="size-6" />
    </a>
  )
}
