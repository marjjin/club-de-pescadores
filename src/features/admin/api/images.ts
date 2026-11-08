import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { adminError } from './errors'

export async function uploadNewsImage(file: File) {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error('Usá una imagen JPG, PNG o WebP de hasta 5 MB.')
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(
      'No pudimos abrir la imagen. Probá con otro archivo JPG, PNG o WebP.',
    )
  })
  try {
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('El navegador no pudo preparar la imagen.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error('No se pudo procesar la imagen.')),
        'image/webp',
        0.85,
      ),
    )
    const client = getAdminSupabase()
    const user = await client.auth.getUser()
    if (user.error || !user.data.user) throw adminError(user.error)
    const path = `${user.data.user.id}/${crypto.randomUUID()}.${blob.type === 'image/webp' ? 'webp' : 'png'}`
    const { error } = await client.storage
      .from('news-images')
      .upload(path, blob, {
        contentType: blob.type,
        upsert: false,
        cacheControl: '31536000',
      })
    if (error) throw adminError(error)
    return client.storage.from('news-images').getPublicUrl(path).data.publicUrl
  } finally {
    bitmap.close()
  }
}
