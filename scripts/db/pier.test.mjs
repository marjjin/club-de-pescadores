// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000030'
const staff = '10000000-0000-4000-8000-000000000031'
const editor = '10000000-0000-4000-8000-000000000032'
const file = (owner, n, ext = 'webp') =>
  `${owner}/3000000${n}-0000-4000-8000-000000000000.${ext}`

async function run(user, sql, args = [], role = 'authenticated') {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: user, aal: 'aal2' }),
    ])
    return tx.query(sql, args)
  })
}
const publish = (user, data, role = 'authenticated') =>
  run(user, 'select public.pier_publish_report($1) as report', [data], role)
const store = (name, owner = staff, age = '0 hours') =>
  db.query(
    `insert into storage.objects(bucket_id,name,owner_id,created_at)
     values ('club-media',$1,$2,now() - $3::interval)`,
    [name, owner, age],
  )
const image = (path, alt = 'Muelle') => ({
  kind: 'image',
  path,
  width: 1600,
  height: 1200,
  alt,
})
const video = (path, poster) => ({
  kind: 'video',
  path,
  poster_path: poster,
  width: 1280,
  height: 720,
  alt: 'Video del muelle',
})
const report = (extra = {}) => ({
  height_cm: 310,
  measured_at: new Date(Date.now() - 60_000).toISOString(),
  conditions: 'Agua clara, poco viento.',
  media: [],
  ...extra,
})

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query(
    'insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6)',
    [
      root,
      'root@example.test',
      staff,
      'staff@example.test',
      editor,
      'editor@example.test',
    ],
  )
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  const staffRole = (
    await db.query(
      "select id from public.roles where name='Empleado del muelle'",
    )
  ).rows[0].id
  const editorRole = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Editor',
      ['noticias.ver', 'noticias.editar'],
    ])
  ).rows[0].id
  await run(root, 'select public.admin_save_user($1,$2,true)', [
    staff,
    [staffRole],
  ])
  await run(root, 'select public.admin_save_user($1,$2,true)', [
    editor,
    [editorRole],
  ])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('pier reports', () => {
  it('routes staff to the pier workspace through the session context', async () => {
    const context = (await run(staff, 'select public.admin_context() as c'))
      .rows[0].c
    expect(context).toMatchObject({ active: true, general: false, pier: true })
    expect(
      (await run(editor, 'select public.admin_context() as c')).rows[0].c.pier,
    ).toBe(false)
  })

  it('requires the river station to be configured first', async () => {
    await expect(publish(staff, report())).rejects.toMatchObject({
      code: 'P0002',
    })
    await run(root, 'select public.admin_save_river_level($1)', [
      JSON.stringify({
        height_cm: 200,
        measured_at: '2026-01-01T13:30:00Z',
        station: 'Muelle del club',
        source: 'Personal del club',
        note: null,
        is_published: true,
      }),
    ])
  })

  it('lets only staff publish, updating the river height in the same transaction', async () => {
    await expect(publish(null, report(), 'anon')).rejects.toMatchObject({
      code: '42501',
    })
    await expect(publish(editor, report())).rejects.toMatchObject({
      code: '42501',
    })
    await store(file(staff, 1))
    const saved = (
      await publish(staff, report({ media: [image(file(staff, 1))] }))
    ).rows[0].report
    expect(saved).not.toHaveProperty('created_by')
    const river = (
      await db.query(
        'select height_cm,station,source,is_published from public.river_levels',
      )
    ).rows[0]
    expect(river).toEqual({
      height_cm: 310,
      station: 'Muelle del club',
      source: 'Personal del club',
      is_published: true,
    })
    const visible = await run(
      null,
      'select r.id, m.path from public.pier_reports r join public.media_items m on m.pier_report_id = r.id',
      [],
      'anon',
    )
    expect(visible.rows).toEqual([{ id: saved.id, path: file(staff, 1) }])
    await expect(
      run(null, 'select created_by from public.pier_reports', [], 'anon'),
    ).rejects.toMatchObject({ code: '42501' })
  })

  it('does not let an older measurement overwrite a newer river height', async () => {
    await publish(
      staff,
      report({ height_cm: 150, measured_at: '2026-01-02T00:00:00Z' }),
    )
    expect(
      (await db.query('select height_cm from public.river_levels')).rows[0]
        .height_cm,
    ).toBe(310)
  })

  it('rejects files that are missing, uploaded by someone else or beyond the limits', async () => {
    await store(file(root, 2), root)
    for (const media of [[image(file(staff, 9))], [image(file(root, 2))]])
      await expect(publish(staff, report({ media }))).rejects.toMatchObject({
        code: '42501',
      })
    const videos = []
    for (let n = 3; n <= 6; n++) {
      await store(file(staff, n, 'mp4'))
      await store(file(staff, n, 'jpg'))
      videos.push(video(file(staff, n, 'mp4'), file(staff, n, 'jpg')))
    }
    await expect(
      publish(staff, report({ media: videos })),
    ).rejects.toMatchObject({ code: '22023' })
    await expect(
      publish(staff, report({ media: [{ ...videos[0], poster_path: null }] })),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('hides unpublished reports and their media from visitors', async () => {
    const latest = (
      await run(staff, 'select public.pier_recent_reports() as items')
    ).rows[0].items[0]
    expect(latest).toMatchObject({ author_email: 'staff@example.test' })
    await run(staff, 'select public.pier_set_report_published($1,false)', [
      latest.id,
    ])
    const rows = await run(
      null,
      'select id from public.pier_reports where id=$1',
      [latest.id],
      'anon',
    )
    expect(rows.rows).toEqual([])
    await expect(
      run(editor, 'select public.pier_set_report_published($1,true)', [
        latest.id,
      ]),
    ).rejects.toMatchObject({ code: '42501' })
  })

  it('detaches media of reports older than 30 days and lists abandoned uploads', async () => {
    await store(file(staff, 7))
    const old = (
      await publish(staff, report({ media: [image(file(staff, 7))] }))
    ).rows[0].report
    await db.query(
      "update public.pier_reports set created_at = now() - interval '31 days' where id=$1",
      [old.id],
    )
    await store(file(staff, 8), staff, '48 hours')
    const pruned = (
      await run(staff, 'select public.admin_prune_club_media() as names')
    ).rows[0].names
    expect(pruned).toEqual(
      expect.arrayContaining([file(staff, 7), file(staff, 8)]),
    )
    expect(pruned).not.toContain(file(staff, 1))
    expect(
      (
        await db.query(
          'select count(*)::int as n from public.media_items where pier_report_id=$1',
          [old.id],
        )
      ).rows[0].n,
    ).toBe(0)
  })

  it('lets staff delete only club media that nothing references', async () => {
    await run(
      staff,
      'delete from storage.objects where bucket_id=$1 and name = any($2)',
      ['club-media', [file(staff, 1), file(staff, 8)]],
    )
    const left = await db.query(
      'select name from storage.objects where name = any($1)',
      [[file(staff, 1), file(staff, 8)]],
    )
    expect(left.rows).toEqual([{ name: file(staff, 1) }])
  })
})
