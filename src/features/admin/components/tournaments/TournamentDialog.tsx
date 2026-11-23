import type { ComponentProps } from 'react'
import { Modal } from '@/shared/ui/Modal'

type Props = Omit<ComponentProps<typeof Modal>, 'open' | 'closeLabel'> & {
  closeLabel: string
}

/**
 * Modal window for the tournament tools (categories, annual tables, QR). It opens
 * while mounted; Esc, the backdrop and the close button animate out, then call onClose.
 */
export function TournamentDialog(props: Props) {
  return <Modal open {...props} />
}
