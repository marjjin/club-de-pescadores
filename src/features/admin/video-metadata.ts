import { targetSize } from './image-optimizer'

// Matches the club-media bucket limit; duration is only checkable in the browser.
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024
export const MAX_VIDEO_SECONDS = 60
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const videoExtension = (type: string) =>
  type === 'video/webm' ? 'webm' : type === 'video/quicktime' ? 'mov' : 'mp4'

export type VideoMetadata = {
  width: number
  height: number
  duration: number
  poster: Blob
}

function once(target: EventTarget, event: string) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener(event, ok)
      target.removeEventListener('error', fail)
    }
    const ok = () => {
      cleanup()
      resolve()
    }
    const fail = () => {
      cleanup()
      reject(new Error('video'))
    }
    target.addEventListener(event, ok)
    target.addEventListener('error', fail)
  })
}

/**
 * Reads size and duration and captures a frame as poster, so visitors download
 * a light image until they choose to play the video.
 */
export async function readVideo(file: File): Promise<VideoMetadata> {
  if (!VIDEO_TYPES.includes(file.type) || file.size > MAX_VIDEO_BYTES)
    throw new Error('Usá un video MP4, MOV o WebM de hasta 30 MB.')
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  try {
    video.src = url
    await once(video, 'loadeddata').catch(() => {
      throw new Error(
        'No pudimos leer el video. Probá exportarlo como MP4 desde el celular.',
      )
    })
    if (!video.videoWidth || !Number.isFinite(video.duration))
      throw new Error('No pudimos leer el video. Probá con otro archivo.')
    if (video.duration > MAX_VIDEO_SECONDS + 0.5)
      throw new Error(
        `El video dura más de ${MAX_VIDEO_SECONDS} segundos. Recortalo antes de subirlo.`,
      )
    // The very first frame is often black; half a second in is usually representative.
    video.currentTime = Math.min(0.5, video.duration / 2)
    await once(video, 'seeked')
    const canvas = document.createElement('canvas')
    Object.assign(canvas, targetSize(video.videoWidth, video.videoHeight))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('El navegador no pudo preparar el video.')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const encode = (type: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.75))
    // Safari cannot encode WebP and silently returns PNG, which the bucket rejects.
    const webp = await encode('image/webp')
    const poster =
      webp?.type === 'image/webp' ? webp : await encode('image/jpeg')
    if (!poster) throw new Error('No pudimos preparar la portada del video.')
    return {
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
      poster,
    }
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}
