// Phone photos often exceed the bucket limit; the limit applies to the optimized result.
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024
export const MAX_OUTPUT_BYTES = 5 * 1024 * 1024
// Twice the widest display (768 px article column) keeps retina screens sharp.
export const MAX_DIMENSION = 1600
const QUALITY = 0.8
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export function targetSize(width: number, height: number) {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function encode(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY),
  )
}

export type OptimizedImage = { blob: Blob; width: number; height: number }
/**
 * Re-encodes every upload, even small ones: drawing to a canvas also strips
 * EXIF metadata such as GPS location (Ley 25.326).
 */
export async function optimizeImage(file: File): Promise<OptimizedImage> {
  if (!ACCEPTED.includes(file.type) || file.size > MAX_SOURCE_BYTES)
    throw new Error('Usá una imagen JPG, PNG o WebP de hasta 25 MB.')
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  }).catch(() => {
    throw new Error(
      'No pudimos abrir la imagen. Probá con otro archivo JPG, PNG o WebP.',
    )
  })
  try {
    const canvas = document.createElement('canvas')
    Object.assign(canvas, targetSize(bitmap.width, bitmap.height))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('El navegador no pudo preparar la imagen.')
    // JPEG has no transparency; a white base avoids black backgrounds from PNGs.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    // Browsers without WebP encoding silently return PNG, which can weigh several MB.
    const webp = await encode(canvas, 'image/webp')
    const blob =
      webp?.type === 'image/webp' ? webp : await encode(canvas, 'image/jpeg')
    if (!blob) throw new Error('No se pudo procesar la imagen.')
    if (blob.size > MAX_OUTPUT_BYTES)
      throw new Error(
        'La imagen sigue siendo demasiado pesada. Probá con otra foto.',
      )
    return { blob, width: canvas.width, height: canvas.height }
  } finally {
    bitmap.close()
  }
}
