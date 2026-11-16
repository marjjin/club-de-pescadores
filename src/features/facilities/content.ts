import grillImage from '@/shared/assets/images/facility-grill.webp'
import hallImage from '@/shared/assets/images/facility-hall.webp'
import pierImage from '@/shared/assets/images/facility-pier.webp'
import riverImage from '@/shared/assets/images/facility-river.webp'
import type { DefaultImage, FacilitiesContent } from './types'

/** Photos bundled with the site; a card uses one until staff upload a replacement. */
export const defaultImages: Record<DefaultImage, string> = {
  pier: pierImage,
  hall: hallImage,
  grill: grillImage,
  river: riverImage,
}

/** Same content the database starts with; shown if it cannot be reached. */
export const defaultFacilities: FacilitiesContent = {
  title: 'Un espacio pensado para los socios',
  description:
    'Todo lo que necesitás para disfrutar del río, en familia o con amigos.',
  cards: [
    {
      id: 'pier',
      name: 'Muelle',
      description: 'Acceso al río y espacio para disfrutar la pesca.',
      imageUrl: pierImage,
      imageAlt: 'Sede amarilla del club y muelle con baranda sobre el río',
    },
    {
      id: 'hall',
      name: 'Quincho',
      description: 'Ideal para reuniones y encuentros.',
      imageUrl: hallImage,
      imageAlt: 'Quincho con mesas de material y paredes amarillas',
    },
    {
      id: 'grill',
      name: 'Parrillas',
      description: 'Espacio equipado para disfrutar en familia.',
      imageUrl: grillImage,
      imageAlt: 'Parrilla grande y mesas largas bajo techo',
    },
    {
      id: 'river',
      name: 'Entorno natural',
      description: 'Ubicación privilegiada sobre el río.',
      imageUrl: riverImage,
      imageAlt: 'Río, costa arbolada y bajada de lanchas',
    },
  ],
}
