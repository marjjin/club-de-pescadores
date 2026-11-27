import { useId } from 'react'
import type { AnchorHTMLAttributes } from 'react'

type Props = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'target' | 'rel' | 'aria-describedby'
> & {
  href: string
}

/**
 * Link to another site (WhatsApp, social networks, maps). It opens in a new tab so
 * the club's page stays open behind it; noopener keeps that site from controlling
 * this tab. Screen readers hear "se abre en otra pestaña" as the link's
 * description, so its name stays what it says on screen.
 */
export function ExternalLink({ children, ...props }: Props) {
  const noticeId = useId()
  return (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      aria-describedby={noticeId}
    >
      {children}
      {/* hidden keeps it out of the name; aria-describedby still reads it. */}
      <span id={noticeId} hidden>
        Se abre en otra pestaña
      </span>
    </a>
  )
}
