import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { optimizeImage } from '../image-optimizer'
import { adminError } from './errors'

export async function uploadNewsImage(file: File) {
  const { blob } = await optimizeImage(file)
  const client = getAdminSupabase()
  const user = await client.auth.getUser()
  if (user.error || !user.data.user) throw adminError(user.error)
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${user.data.user.id}/${crypto.randomUUID()}.${extension}`
  const { error } = await client.storage
    .from('news-images')
    .upload(path, blob, {
      contentType: blob.type,
      upsert: false,
      cacheControl: '31536000',
    })
  if (error) throw adminError(error)
  return client.storage.from('news-images').getPublicUrl(path).data.publicUrl
}

const publicPrefix = '/storage/v1/object/public/news-images/'
/** Mirrors private.news_image_path(): only covers stored in our bucket have a path. */
export function newsImagePath(url: string | null | undefined) {
  const path = url?.split(publicPrefix)[1]
  return path && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|png)$/.test(path)
    ? path
    : null
}
/**
 * Best effort: the storage policy only lets through images no news uses, so a
 * refused or failed removal just leaves the file for the periodic cleanup.
 */
export async function removeNewsImages(paths: (string | null)[]) {
  const names = [...new Set(paths.filter((path) => path !== null))]
  if (!names.length) return
  await getAdminSupabase()
    .storage.from('news-images')
    .remove(names)
    .catch(() => undefined)
}
export async function deleteNewsPermanently(id: string, version: string) {
  const { data, error } = await getAdminSupabase().rpc('admin_delete_news', {
    p_id: id,
    p_version: version,
  })
  if (error) throw adminError(error)
  await removeNewsImages([typeof data === 'string' ? data : null])
}
export async function removeUnusedNewsImages() {
  const { data, error } = await getAdminSupabase().rpc(
    'admin_unused_news_images',
  )
  if (error || !Array.isArray(data)) return
  await removeNewsImages(data.filter((name) => typeof name === 'string'))
}
