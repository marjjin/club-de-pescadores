import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { randomUuid } from '@/shared/lib/random-id'
import { optimizeImage } from '../image-optimizer'
import { readVideo, videoExtension, VIDEO_TYPES } from '../video-metadata'
import type { MediaInput } from '../schemas/media'
import { adminError } from './errors'

const bucket = 'club-media'
// Without alt the upload is not attachable yet; the caller fills it before saving.
// Distributes over the union so video-only fields such as poster_path survive.
export type UploadedMedia = MediaInput extends infer Item
  ? Item extends MediaInput
    ? Omit<Item, 'alt'>
    : never
  : never

export const isVideoFile = (file: File) => VIDEO_TYPES.includes(file.type)
export const clubMediaUrl = (path: string) =>
  getAdminSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl

async function put(owner: string, blob: Blob, extension: string) {
  const path = `${owner}/${randomUuid()}.${extension}`
  const { error } = await getAdminSupabase()
    .storage.from(bucket)
    .upload(path, blob, {
      contentType: blob.type,
      upsert: false,
      cacheControl: '31536000',
    })
  if (error) throw adminError(error)
  return path
}

/** What actually reached storage, shown to staff so the optimization is visible. */
export type UploadResult = {
  media: UploadedMedia
  bytes: number
  format: string
}
const format = (type: string) =>
  ({
    'image/webp': 'WebP',
    'image/jpeg': 'JPEG',
    'video/quicktime': 'MOV',
    'video/webm': 'WebM',
  })[type] ?? 'MP4'

export async function uploadClubMedia(file: File): Promise<UploadResult> {
  const user = await getAdminSupabase().auth.getUser()
  if (user.error || !user.data.user) throw adminError(user.error)
  const owner = user.data.user.id
  if (isVideoFile(file)) {
    const video = await readVideo(file)
    const posterPath = await put(
      owner,
      video.poster,
      video.poster.type === 'image/webp' ? 'webp' : 'jpg',
    )
    try {
      const path = await put(owner, file, videoExtension(file.type))
      return {
        media: {
          kind: 'video',
          path,
          poster_path: posterPath,
          width: video.width,
          height: video.height,
        },
        bytes: file.size,
        format: format(file.type),
      }
    } catch (error) {
      await removeClubMedia([posterPath])
      throw error
    }
  }
  const image = await optimizeImage(file)
  const path = await put(
    owner,
    image.blob,
    image.blob.type === 'image/webp' ? 'webp' : 'jpg',
  )
  return {
    media: { kind: 'image', path, width: image.width, height: image.height },
    bytes: image.blob.size,
    format: format(image.blob.type),
  }
}

/**
 * Best effort: the storage policy only lets through files nothing references, so a
 * refused or failed removal just leaves them for the periodic cleanup.
 */
export async function removeClubMedia(paths: (string | null | undefined)[]) {
  const names = [...new Set(paths.filter((path) => typeof path === 'string'))]
  if (!names.length) return
  await getAdminSupabase()
    .storage.from(bucket)
    .remove(names)
    .catch(() => undefined)
}
export const mediaFiles = (items: UploadedMedia[]) =>
  items.flatMap((item) =>
    item.kind === 'video' ? [item.path, item.poster_path] : [item.path],
  )

export async function pruneClubMedia() {
  const { data, error } = await getAdminSupabase().rpc('admin_prune_club_media')
  if (error || !Array.isArray(data)) return
  // Storage accepts bounded batches; the RPC already caps each list at 50 names.
  await removeClubMedia(data.filter((name) => typeof name === 'string'))
}
