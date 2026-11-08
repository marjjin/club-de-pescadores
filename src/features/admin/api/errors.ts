import type { z } from '@/shared/lib/validation'

export function parseAdminResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success)
    throw new Error(
      'No pudimos interpretar los datos recibidos. Actualizá la página o consultá al responsable del sistema.',
    )
  return result.data
}

export function adminError(error: unknown): Error {
  const code =
    error && typeof error === 'object' && 'code' in error ? error.code : null
  const messages: Record<string, string> = {
    '42501':
      'No tenés permiso para esta acción. Revisá tu sesión y segundo factor.',
    '40001':
      'Otra persona modificó este registro. Actualizá la lista antes de volver a editar.',
    '23503':
      'El registro tiene asignaciones o referencias. Revisalas antes de continuar.',
    '23505': 'Ya existe un registro con esos datos.',
    '23514':
      'Los datos no cumplen las condiciones. Debe quedar un administrador general activo.',
    '22023': 'Revisá los datos y los permisos seleccionados.',
    P0002: 'El registro ya no está disponible.',
    PGRST202:
      'El panel todavía no está habilitado en Supabase. Falta aplicar su migración.',
  }
  return new Error(
    typeof code === 'string' && messages[code]
      ? messages[code]
      : 'No se pudo completar la operación. Revisá la conexión e intentá nuevamente.',
  )
}
