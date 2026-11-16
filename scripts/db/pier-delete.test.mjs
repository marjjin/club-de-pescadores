// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000070'
const staff = '10000000-0000-4000-8000-000000000071'
const editor = '10000000-0000-4000-8000-000000000072'
const file = (n) => `${staff}/4000000${n}-0000-4000-8000-000000000000.webp`

async function run(user, sql, args = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated')
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: user, aal: 'aal2' }),
    ])
    return tx.query(sql, args)
  })
}
const minutesAgo = (n) => new Date(Date.now() - n * 60_000).toISOString()
const publish = (height, minutes, media = []) =>
  run(staff, 'select public.pier_publish_report($1) as report', [
    { height_cm: height, measured_at: minutesAgo(minutes), media },
  ]).then((result) => result.rows[0].report.id)
const remove = (id, user = staff) =>
  run(user, 'select public.pier_delete_report($1) as files', [id]).then(
    (result) => result.rows[0].files,
  )
const river = () =>
  db
    .query('select height_cm, is_published from public.river_levels')
    .then((result) => result.rows[0])

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
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('deleting pier reports', () => {
  it('needs the pier permission and returns the files to remove', async () => {
    await db.query(
      "insert into storage.objects(bucket_id,name,owner_id) values ('club-media',$1,$2)",
      [file(1), staff],
    )
    const id = await publish(250, 30, [
      {
        kind: 'image',
        path: file(1),
        width: 1600,
        height: 1200,
        alt: 'Muelle',
      },
    ])
    await expect(remove(id, editor)).rejects.toThrow()
    expect(await remove(id)).toEqual([file(1)])
    expect(
      (await db.query('select 1 from public.pier_reports where id = $1', [id]))
        .rows,
    ).toHaveLength(0)
    expect(
      (
        await db.query(
          'select 1 from public.media_items where pier_report_id = $1',
          [id],
        )
      ).rows,
    ).toHaveLength(0)
    expect(
      (
        await db.query(
          "select 1 from public.audit_logs where action = 'pier_reports.delete' and resource_id = $1",
          [id],
        )
      ).rows,
    ).toHaveLength(1)
    await expect(remove(id)).rejects.toMatchObject({ code: 'P0002' })
  })

  it('falls back to the previous height when the current one is deleted', async () => {
    const older = await publish(300, 20)
    const latest = await publish(340, 10)
    expect(await river()).toMatchObject({ height_cm: 340, is_published: true })
    // Deleting an older report leaves the current height alone.
    const stale = await publish(280, 15)
    await remove(stale)
    expect((await river()).height_cm).toBe(340)
    await remove(latest)
    expect(await river()).toMatchObject({ height_cm: 300, is_published: true })
    await remove(older)
    expect((await river()).is_published).toBe(false)
  })
})
