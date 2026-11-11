import { useRef, useState } from 'react'
import {
  clubMediaUrl,
  isVideoFile,
  mediaFiles,
  removeClubMedia,
  uploadClubMedia,
} from '../api/media'
import type { UploadedMedia } from '../api/media'
import { MAX_MEDIA, MAX_VIDEOS } from '../schemas/media'
import { randomUuid } from '@/shared/lib/random-id'

export type MediaDraft = {
  id: string
  name: string
  kind: 'image' | 'video'
  status: 'uploading' | 'ready' | 'error'
  error?: string
  media?: UploadedMedia
  /** Public URL of the photo or the video poster, once uploaded. */
  preview?: string
  /** Final format and weight after optimization, e.g. "WebP · 240 KB". */
  summary?: string
}

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

/** `initial` restores uploads from an unsent draft as ready items. */
export function useMediaUploads(initial: UploadedMedia[] = []) {
  const [drafts, setDrafts] = useState<MediaDraft[]>(() =>
    initial.map((media) => ({
      id: randomUuid(),
      name: media.path.split('/').at(-1) ?? 'archivo',
      kind: media.kind,
      status: 'ready',
      media,
      preview: clubMediaUrl(
        media.kind === 'video' ? media.poster_path : media.path,
      ),
    })),
  )
  const [notice, setNotice] = useState<string | null>(null)
  // Sequential uploads keep mobile data and the free bandwidth quota predictable.
  const queue = useRef(Promise.resolve())
  const update = (id: string, patch: Partial<MediaDraft>) =>
    setDrafts((list) =>
      list.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    )

  function add(files: File[]) {
    setNotice(null)
    let slots = MAX_MEDIA - drafts.length
    let videoSlots =
      MAX_VIDEOS - drafts.filter((draft) => draft.kind === 'video').length
    const accepted: { draft: MediaDraft; file: File }[] = []
    let skipped = 0
    for (const file of files) {
      const video = isVideoFile(file)
      if (slots <= 0 || (video && videoSlots <= 0)) {
        skipped++
        continue
      }
      slots--
      if (video) videoSlots--
      accepted.push({
        file,
        draft: {
          id: randomUuid(),
          name: file.name,
          kind: video ? 'video' : 'image',
          status: 'uploading',
        },
      })
    }
    if (skipped)
      setNotice(
        `No sumamos ${skipped === 1 ? 'un archivo' : `${skipped} archivos`}: el límite es ${MAX_MEDIA} archivos y hasta ${MAX_VIDEOS} videos.`,
      )
    setDrafts((list) => [...list, ...accepted.map(({ draft }) => draft)])
    for (const { draft, file } of accepted)
      queue.current = queue.current.then(() =>
        uploadClubMedia(file).then(
          ({ media, bytes, format }) =>
            update(draft.id, {
              status: 'ready',
              media,
              summary: `${format} · ${formatBytes(bytes)}`,
              preview: clubMediaUrl(
                media.kind === 'video' ? media.poster_path : media.path,
              ),
            }),
          (error: unknown) =>
            update(draft.id, {
              status: 'error',
              error:
                error instanceof Error
                  ? error.message
                  : 'No pudimos subir el archivo.',
            }),
        ),
      )
  }
  function remove(id: string) {
    const draft = drafts.find((item) => item.id === id)
    if (draft?.media) void removeClubMedia(mediaFiles([draft.media]))
    setDrafts((list) => list.filter((item) => item.id !== id))
  }
  function move(id: string, step: -1 | 1) {
    setDrafts((list) => {
      const from = list.findIndex((item) => item.id === id)
      const to = from + step
      if (from < 0 || to < 0 || to >= list.length) return list
      const next = [...list]
      const [item] = next.splice(from, 1)
      if (item) next.splice(to, 0, item)
      return next
    })
  }
  /** Removes every uploaded file; used when the form is left without publishing. */
  function discard() {
    void removeClubMedia(
      mediaFiles(drafts.flatMap((draft) => (draft.media ? [draft.media] : []))),
    )
    setDrafts([])
  }
  return {
    drafts,
    notice,
    busy: drafts.some((draft) => draft.status === 'uploading'),
    ready: drafts.flatMap((draft) =>
      draft.status === 'ready' && draft.media ? [draft.media] : [],
    ),
    hasErrors: drafts.some((draft) => draft.status === 'error'),
    add,
    remove,
    move,
    discard,
    clear: () => setDrafts([]),
  }
}
