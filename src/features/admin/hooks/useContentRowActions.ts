import type { Content, ContentKind } from '../schemas/admin'
import { useContentActions } from './useAdminActions'

export function useContentRowActions(kind: ContentKind) {
  const { archive, deleteNews } = useContentActions()
  function toggleArchive(row: Content) {
    const restore = Boolean(row.deleted_at)
    if (
      !window.confirm(
        restore
          ? '¿Restaurar este contenido como borrador?'
          : '¿Enviar este contenido a la papelera? Dejará de verse en el sitio.',
      )
    )
      return
    deleteNews.reset()
    archive.mutate([kind, row.id, row.updated_at, restore])
  }
  function remove(row: Content) {
    if (
      !window.confirm(
        '¿Eliminar definitivamente esta noticia? También se borrará su imagen. Esta acción no se puede deshacer.',
      )
    )
      return
    archive.reset()
    deleteNews.mutate([row.id, row.updated_at])
  }
  const success = deleteNews.isSuccess
    ? 'Noticia eliminada definitivamente.'
    : archive.isSuccess
      ? archive.variables?.[3]
        ? 'Contenido restaurado como borrador.'
        : 'Contenido enviado a la papelera.'
      : null
  return {
    busy: archive.isPending || deleteNews.isPending,
    error: archive.error ?? deleteNews.error,
    success,
    toggleArchive,
    // Permanent deletion exists only for news, the only content with stored files.
    remove: kind === 'news' ? remove : undefined,
  }
}
