// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000050'
const events = '10000000-0000-4000-8000-000000000051'

async function run(user, sql, args = [], role = 'authenticated') {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(user ? { sub: user, aal: 'aal2' } : {}),
    ])
    return tx.query(sql, args)
  })
}
const create = (data = {}) =>
  run(root, 'select public.tournament_save($1) as id', [
    {
      name: 'Torneo de la corvina',
      starts_on: '2026-12-05',
      start_time: '07:30',
      ...data,
    },
  ]).then((result) => result.rows[0].id)
const status = (id, value) =>
  run(root, 'select public.tournament_set_status($1,$2)', [id, value])
const linked = async (id) =>
  (
    await db.query(
      'select id, title, starts_at, place, is_published, deleted_at, show_time, updated_at from public.events where tournament_id = $1',
      [id],
    )
  ).rows[0]
const visible = async (id) =>
  (
    await run(
      null,
      'select id from public.events where tournament_id = $1',
      [id],
      'anon',
    )
  ).rows.length === 1

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)', [
    root,
    'root@example.test',
    events,
    'events@example.test',
  ])
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  const role = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Agenda',
      ['eventos.ver', 'eventos.editar', 'eventos.publicar', 'eventos.archivar'],
    ])
  ).rows[0].id
  await run(root, 'select public.admin_save_user($1,$2,true)', [events, [role]])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('tournaments in the events agenda', () => {
  it('creates a hidden event with the club time and a default place', async () => {
    const id = await create()
    const event = await linked(id)
    expect(event).toMatchObject({
      title: 'Torneo de la corvina',
      place: 'Club de Pescadores San Nicolás',
      is_published: false,
      deleted_at: null,
      show_time: true,
    })
    // 07:30 in Argentina (UTC-3) is 10:30 UTC.
    expect(new Date(event.starts_at).toISOString()).toBe(
      '2026-12-05T10:30:00.000Z',
    )
    expect(await visible(id)).toBe(false)
  })

  it('follows the tournament status: published and finished show it, archived hides it', async () => {
    const id = await create({ name: 'Torneo de estados' })
    await status(id, 'published')
    expect(await visible(id)).toBe(true)
    await status(id, 'finished')
    expect(await visible(id)).toBe(true)
    await status(id, 'archived')
    expect(await linked(id)).toMatchObject({ is_published: false })
    expect((await linked(id)).deleted_at).not.toBeNull()
    expect(await visible(id)).toBe(false)
    await status(id, 'draft')
    expect(await linked(id)).toMatchObject({
      is_published: false,
      deleted_at: null,
    })
  })

  it('updates the event when the tournament changes and requires a start time', async () => {
    const id = await create({ name: 'Torneo a editar' })
    const { updated_at } = (
      await run(root, 'select public.tournament_admin_get($1) as data', [id])
    ).rows[0].data
    await run(root, 'select public.tournament_save($1,$2,$3)', [
      {
        name: 'Torneo editado',
        place: 'Muelle norte',
        starts_on: '2026-12-06',
        start_time: '18:00',
      },
      id,
      updated_at,
    ])
    const event = await linked(id)
    expect(event).toMatchObject({
      title: 'Torneo editado',
      place: 'Muelle norte',
    })
    expect(new Date(event.starts_at).toISOString()).toBe(
      '2026-12-06T21:00:00.000Z',
    )
    await expect(create({ name: 'Sin hora', start_time: '' })).rejects.toThrow(
      /hora de inicio/,
    )
    await expect(
      create({ name: 'Hora rara', start_time: '25:00' }),
    ).rejects.toThrow()
  })

  it('never lets the events editor change or archive a tournament event', async () => {
    const id = await create({ name: 'Torneo protegido' })
    const event = await linked(id)
    await expect(
      run(events, "select public.admin_save_content('events',$1,$2,$3)", [
        {
          title: 'Cambiado',
          starts_at: '2030-01-01T18:00:00Z',
          place: 'Otro',
          is_published: true,
        },
        event.id,
        event.updated_at,
      ]),
    ).rejects.toThrow(/Torneos/)
    await expect(
      run(events, "select public.admin_archive_content('events',$1,$2,false)", [
        event.id,
        event.updated_at,
      ]),
    ).rejects.toThrow(/Torneos/)
    expect((await linked(id)).title).toBe('Torneo protegido')
    const listed = (
      await run(events, "select public.admin_list('events') as rows")
    ).rows[0].rows
    expect(listed.find((row) => row.id === event.id)?.tournament_id).toBe(id)
  })

  it('keeps ordinary events editable and the hour hidden only for tournaments', async () => {
    const created = (
      await run(
        events,
        "select public.admin_save_content('events',$1) as item",
        [
          {
            title: 'Asamblea',
            starts_at: '2030-01-01T18:00:00Z',
            place: 'Sede',
            is_published: false,
          },
        ],
      )
    ).rows[0].item
    expect(created.tournament_id).toBeNull()
    await expect(
      db.query('update public.events set show_time = false where id = $1', [
        created.id,
      ]),
    ).rejects.toThrow(/events_show_time_only_tournaments/)
  })
})

describe('tournament description', () => {
  it('is public on the tournament and summarized in its agenda event', async () => {
    const long = `Premios del 1.º al 10.º puesto. ${'Modalidad caña libre. '.repeat(40)}`
    const id = await create({
      name: 'Tradicional 12 hs',
      description: `  ${long}  `,
    })
    const saved = (
      await db.query(
        'select description from public.tournaments where id = $1',
        [id],
      )
    ).rows[0].description
    expect(saved).toBe(long.trim())
    const event = (
      await db.query(
        'select description from public.events where tournament_id = $1',
        [id],
      )
    ).rows[0].description
    expect(event).toHaveLength(600)
    expect(event.endsWith('…')).toBe(true)
    await status(id, 'published')
    expect(
      (
        await run(
          null,
          'select description from public.tournaments where id = $1',
          [id],
          'anon',
        )
      ).rows[0].description,
    ).toBe(long.trim())
  })

  it('keeps the description when an older panel saves without it, and clears it when emptied', async () => {
    const id = await create({
      name: 'Con descripción',
      description: 'Inscripción $25.000',
    })
    const version = async () =>
      (await run(root, 'select public.tournament_admin_get($1) as data', [id]))
        .rows[0].data
    const base = {
      name: 'Con descripción',
      starts_on: '2026-12-05',
      start_time: '07:30',
    }
    await run(root, 'select public.tournament_save($1,$2,$3)', [
      base,
      id,
      (await version()).updated_at,
    ])
    expect((await version()).description).toBe('Inscripción $25.000')
    await run(root, 'select public.tournament_save($1,$2,$3)', [
      { ...base, description: '   ' },
      id,
      (await version()).updated_at,
    ])
    expect((await version()).description).toBeNull()
    expect(
      (
        await db.query(
          'select description from public.events where tournament_id = $1',
          [id],
        )
      ).rows[0].description,
    ).toBeNull()
    await expect(
      create({ name: 'Muy larga', description: 'x'.repeat(2001) }),
    ).rejects.toThrow()
  })
})
