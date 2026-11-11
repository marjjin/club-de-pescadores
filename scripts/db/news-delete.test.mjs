// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000020'
const editor = '10000000-0000-4000-8000-000000000021'
const base = 'https://project.supabase.co/storage/v1/object/public/news-images/'
const path = (n) => `${root}/2000000${n}-0000-4000-8000-000000000000.webp`

async function run(user, sql, args = [], role = 'authenticated') {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: user, aal: 'aal2' }),
    ])
    return tx.query(sql, args)
  })
}
async function createNews(image, archived = true) {
  const item = (
    await run(root, "select public.admin_save_content('news',$1) as item", [
      {
        title: 'Noticia a eliminar',
        excerpt: 'Texto de prueba.',
        image_url: `${base}${image}`,
        image_alt: 'Prueba',
        published_at: '2026-01-01T00:00:00Z',
        is_published: false,
      },
    ])
  ).rows[0].item
  if (!archived) return item
  await run(root, "select public.admin_archive_content('news',$1,$2,false)", [
    item.id,
    item.updated_at,
  ])
  return (
    await db.query('select id,updated_at from public.news where id=$1', [
      item.id,
    ])
  ).rows[0]
}
const storeObject = (name, owner = root, age = '0 hours') =>
  db.query(
    `insert into storage.objects(bucket_id,name,owner_id,created_at)
     values ('news-images',$1,$2,now() - $3::interval)`,
    [name, owner, age],
  )
const objectExists = async (name) =>
  (await db.query('select 1 from storage.objects where name=$1', [name])).rows
    .length === 1

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)', [
    root,
    'root@example.test',
    editor,
    'editor@example.test',
  ])
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  const role = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Editor',
      ['noticias.ver', 'noticias.editar', 'noticias.archivar'],
    ])
  ).rows[0].id
  await run(root, 'select public.admin_save_user($1,$2,true)', [editor, [role]])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('permanent news deletion', () => {
  it('requires the dedicated permission and an archived, unchanged row', async () => {
    const live = await createNews(path(1), false)
    await expect(
      run(root, 'select public.admin_delete_news($1,$2)', [
        live.id,
        live.updated_at,
      ]),
    ).rejects.toMatchObject({ code: '22023' })
    const archived = await createNews(path(2))
    for (const [user, role] of [
      [null, 'anon'],
      [editor, 'authenticated'],
    ])
      await expect(
        run(
          user,
          'select public.admin_delete_news($1,$2)',
          [archived.id, archived.updated_at],
          role,
        ),
      ).rejects.toMatchObject({ code: '42501' })
    await expect(
      run(root, 'select public.admin_delete_news($1,now())', [archived.id]),
    ).rejects.toMatchObject({ code: '40001' })
  })

  it('deletes the row, audits it and returns the image only when nobody else uses it', async () => {
    const shared = path(3)
    const first = await createNews(shared)
    const second = await createNews(shared)
    const kept = (
      await run(root, 'select public.admin_delete_news($1,$2) as path', [
        first.id,
        first.updated_at,
      ])
    ).rows[0].path
    expect(kept).toBeNull()
    const freed = (
      await run(root, 'select public.admin_delete_news($1,$2) as path', [
        second.id,
        second.updated_at,
      ])
    ).rows[0].path
    expect(freed).toBe(shared)
    expect(
      (
        await db.query(
          "select before_data->>'id' as id from public.audit_logs where action='news.delete' order by created_at",
        )
      ).rows.map((row) => row.id),
    ).toEqual([first.id, second.id])
  })
})

describe('news image storage cleanup', () => {
  it('lets editors delete only unused images that are theirs or older than 24 h', async () => {
    const used = path(4)
    const ownFresh = path(5)
    const othersFresh = path(6)
    const othersOld = path(7)
    await createNews(used, false)
    await storeObject(used, editor, '48 hours')
    await storeObject(ownFresh, editor)
    await storeObject(othersFresh, root)
    await storeObject(othersOld, root, '48 hours')
    await run(
      editor,
      'delete from storage.objects where bucket_id=$1 and name = any($2)',
      ['news-images', [used, ownFresh, othersFresh, othersOld]],
    )
    expect(await objectExists(used)).toBe(true)
    expect(await objectExists(othersFresh)).toBe(true)
    expect(await objectExists(ownFresh)).toBe(false)
    expect(await objectExists(othersOld)).toBe(false)
    await run(null, 'delete from storage.objects', [], 'anon').catch(() => {})
    expect(await objectExists(used)).toBe(true)
  })

  it('lists at most 50 abandoned uploads older than 24 h and hides them from anonymous users', async () => {
    const draftImage = path(8)
    await createNews(draftImage, true)
    await storeObject(draftImage, root, '48 hours')
    const abandoned = path(9)
    await storeObject(abandoned, root, '48 hours')
    const unused = (
      await run(editor, 'select public.admin_unused_news_images() as names')
    ).rows[0].names
    expect(unused).toContain(abandoned)
    expect(unused).not.toContain(draftImage)
    expect(unused).not.toContain(path(6))
    await expect(
      run(null, 'select public.admin_unused_news_images()', [], 'anon'),
    ).rejects.toMatchObject({ code: '42501' })
  })
})
