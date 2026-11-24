import { describe, expect, it, vi } from 'vitest'

const remove = vi.fn()
const upload = vi.fn()
const rpc = vi.fn()
vi.mock('@/lib/supabase/admin-client', () => ({
  getAdminSupabase: () => ({
    rpc,
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: 'uploader' } }, error: null }),
    },
    storage: {
      from: () => ({
        remove,
        upload,
        getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
      }),
    },
  }),
}))
vi.mock('../image-optimizer', () => ({
  optimizeImage: () =>
    Promise.resolve({ blob: new Blob(['x'], { type: 'image/webp' }) }),
}))
const {
  deleteNewsPermanently,
  newsImagePath,
  removeNewsImages,
  uploadNewsImage,
} = await import('./images')

const name =
  '10000000-0000-4000-8000-000000000010/20000000-0000-4000-8000-000000000000.webp'
const url = `https://project.supabase.co/storage/v1/object/public/news-images/${name}`

describe('news image cleanup', () => {
  it('recognises only covers stored in the club bucket', () => {
    expect(newsImagePath(url)).toBe(name)
    expect(newsImagePath('https://example.test/foto.webp')).toBeNull()
    expect(newsImagePath(`${url}/../../otra.webp`)).toBeNull()
    expect(newsImagePath(null)).toBeNull()
  })
  it('removes each image once and never fails the user action when Storage refuses', async () => {
    remove.mockRejectedValueOnce(new Error('denied'))
    await expect(removeNewsImages([name, null, name])).resolves.toBeUndefined()
    expect(remove).toHaveBeenCalledWith([name])
    remove.mockClear()
    await removeNewsImages([null])
    expect(remove).not.toHaveBeenCalled()
  })
  it('removes the cover only when the database reports it is no longer used', async () => {
    remove.mockResolvedValue({ data: [], error: null })
    rpc.mockResolvedValueOnce({ data: null, error: null })
    await deleteNewsPermanently('id', '2026-01-01T00:00:00Z')
    expect(remove).not.toHaveBeenCalled()
    rpc.mockResolvedValueOnce({ data: name, error: null })
    await deleteNewsPermanently('id', '2026-01-01T00:00:00Z')
    expect(rpc).toHaveBeenLastCalledWith('admin_delete_news', {
      p_id: 'id',
      p_version: '2026-01-01T00:00:00Z',
    })
    expect(remove).toHaveBeenCalledWith([name])
  })
})

describe('news image upload', () => {
  it('caches covers for a day, so a deleted photo stops being served by the CDN', async () => {
    upload.mockResolvedValue({ data: {}, error: null })
    await uploadNewsImage(new File(['x'], 'foto.jpg', { type: 'image/jpeg' }))
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^uploader\/[0-9a-f-]{36}\.webp$/),
      expect.any(Blob),
      { contentType: 'image/webp', upsert: false, cacheControl: '86400' },
    )
  })
})
