import type { Angler } from '../../schemas/tournaments'

/** Full name as staff see it; the public table shows "Nombre I." instead. */
export const personLabel = (angler: Pick<Angler, 'first_name' | 'last_name'>) =>
  `${angler.first_name} ${angler.last_name}`
