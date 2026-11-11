import type { Content, ContentKind } from '../schemas/admin'
import { useContentActions } from './useAdminActions'
import { useConfirm } from './useConfirm'

export function useContentRowActions(kind: ContentKind) {
  const { archive, deleteNews } = useContentActions()
  const confirm = useConfirm()
  async function toggleArchive(row: Content) {
    const restore = Boolean(row.deleted_at)
    const accepted = await confirm(
      restore
        ? {
            title: '¿Restaurar este contenido?',
            message: 'Vuelve como borrador; no se publica automáticamente.',
            confirmLabel: 'Restaurar',
          }
        : {
            title: '¿Enviar a la papelera?',
            message:
              'Dejará de verse en el sitio. Podés restaurarlo desde Archivados.',
            confirmLabel: 'Enviar a la papelera',
            tone: 'danger',
          },
    )
    if (!accepted) return
    deleteNews.reset()
    archive.mutate([kind, row.id, row.updated_at, restore])
  }
  async function remove(row: Content) {
    const accepted = await confirm({
      title: '¿Eliminar definitivamente esta noticia?',
      message:
        'También se borrará su imagen. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar definitivamente',
      tone: 'danger',
    })
    if (!accepted) return
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
    toggleArchive: (row: Content) => void toggleArchive(row),
    // Permanent deletion exists only for news, the only content with stored files.
    remove: kind === 'news' ? (row: Content) => void remove(row) : undefined,
  }
}
