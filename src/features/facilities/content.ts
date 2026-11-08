import grillImage from '@/shared/assets/images/facility-grill.webp'
import hallImage from '@/shared/assets/images/facility-hall.webp'
import pierImage from '@/shared/assets/images/facility-pier.webp'
import riverImage from '@/shared/assets/images/facility-river.webp'

export const facilities = [
  {
    name: 'Muelle',
    description: 'Acceso al río y espacio para disfrutar la pesca.',
    imageUrl: pierImage,
    imageAlt: 'Sede amarilla del club y muelle con baranda sobre el río',
  },
  {
    name: 'Quincho',
    description: 'Ideal para reuniones y encuentros.',
    imageUrl: hallImage,
    imageAlt: 'Quincho con mesas de material y paredes amarillas',
  },
  {
    name: 'Parrillas',
    description: 'Espacio equipado para disfrutar en familia.',
    imageUrl: grillImage,
    imageAlt: 'Parrilla grande y mesas largas bajo techo',
  },
  {
    name: 'Entorno natural',
    description: 'Ubicación privilegiada sobre el río.',
    imageUrl: riverImage,
    imageAlt: 'Río, costa arbolada y bajada de lanchas',
  },
]
