import {
  Anchor,
  Caravan,
  Fence,
  Glasses,
  Kayak,
  Sailboat,
  Ship,
  Tent,
  Ticket,
  UserRound,
  UsersRound,
  Van,
  Warehouse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FeeIcon } from './types'

/** Icon and the name staff see when choosing it in the panel. */
export const feeIcons: Record<FeeIcon, { icon: LucideIcon; label: string }> = {
  person: { icon: UserRound, label: 'Persona' },
  family: { icon: UsersRound, label: 'Familia' },
  senior: { icon: Glasses, label: 'Jubilado' },
  sailboat: { icon: Sailboat, label: 'Velero' },
  boat: { icon: Ship, label: 'Lancha' },
  garage: { icon: Warehouse, label: 'Guardería cerrada' },
  rack: { icon: Fence, label: 'Guardería abierta' },
  kayak: { icon: Kayak, label: 'Kayak' },
  anchor: { icon: Anchor, label: 'Ancla' },
  tent: { icon: Tent, label: 'Carpa' },
  caravan: { icon: Caravan, label: 'Casilla rodante' },
  motorhome: { icon: Van, label: 'Motorhome' },
  ticket: { icon: Ticket, label: 'Entrada' },
}
