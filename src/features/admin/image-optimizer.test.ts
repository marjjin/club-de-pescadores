import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_DIMENSION, optimizeImage, targetSize } from './image-optimizer'

const close = vi.fn()
function mockCanvas(encoder: (type: string) => Blob | null) {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn().mockResolvedValue({ width: 4000, height: 3000, close }),
  )
  const context = { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback, type = 'image/png') => callback(encoder(type)),
  )
  return context
}
const photo = (size = 8 * 1024 * 1024, type = 'image/jpeg') =>
  new File([new Uint8Array(size)], 'foto.jpg', { type })

afterEach(() => close.mockClear())

describe('optimizeImage', () => {
  it('scales the longest side down to the display limit and never upscales', () => {
    expect(targetSize(4000, 3000)).toEqual({ width: 1600, height: 1200 })
    expect(targetSize(3000, 4000)).toEqual({ width: 1200, height: 1600 })
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600 })
    expect(MAX_DIMENSION).toBe(1600)
  })
  it('accepts phone photos above 5 MB and returns a small WebP', async () => {
    const context = mockCanvas(
      (type) => new Blob([new Uint8Array(300_000)], { type }),
    )
    const { blob, width, height } = await optimizeImage(photo())
    expect(blob.type).toBe('image/webp')
    expect({ width, height }).toEqual({ width: 1600, height: 1200 })
    expect(context.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      1600,
      1200,
    )
    expect(close).toHaveBeenCalled()
  })
  it('falls back to JPEG when the browser cannot encode WebP', async () => {
    mockCanvas(
      (type) =>
        new Blob([new Uint8Array(10)], {
          type: type === 'image/webp' ? 'image/png' : type,
        }),
    )
    expect((await optimizeImage(photo())).blob.type).toBe('image/jpeg')
  })
  it('rejects unsupported, oversized or still too heavy files with clear messages', async () => {
    await expect(optimizeImage(photo(10, 'image/gif'))).rejects.toThrow(
      'Usá una imagen JPG, PNG o WebP de hasta 25 MB.',
    )
    await expect(optimizeImage(photo(26 * 1024 * 1024))).rejects.toThrow(
      'hasta 25 MB',
    )
    mockCanvas((type) => new Blob([new Uint8Array(6 * 1024 * 1024)], { type }))
    await expect(optimizeImage(photo())).rejects.toThrow('demasiado pesada')
    expect(close).toHaveBeenCalled()
  })
})
