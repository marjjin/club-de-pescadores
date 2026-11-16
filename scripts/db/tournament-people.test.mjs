// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000060'
const viewer = '10000000-0000-4000-8000-000000000061'
const cats = {}

async function run(user, sql, args = [], role = 'authenticated') {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(user ? { sub: user, aal: 'aal2' } : {}),
    ])
    return tx.query(sql, args)
  })
}
const value = (result) => Object.values(result.rows[0])[0]
const category = (name, user = root) =>
  run(user, 'select public.tournament_category_save($1) as id', [name]).then(
    value,
  )
const tournament = (categories) =>
  run(root, 'select public.tournament_save($1) as id', [
    {
      name: 'Torneo por categorías',
      starts_on: '2026-12-05',
      start_time: '08:00',
      categories,
    },
  ]).then(value)
const person = (first_name, last_name, dni, user = root) =>
  run(user, 'select public.angler_save($1) as data', [
    { first_name, last_name, dni },
  ]).then(value)
const join = (id, categoryId, angler) =>
  run(root, 'select public.tournament_add_participant($1,$2,$3,true) as id', [
    id,
    categoryId,
    angler,
  ]).then(value)
const score = (entry, points) =>
  run(root, 'select public.tournament_add_points($1,$2)', [entry, points])
const board = (id, categoryId) =>
  run(
    null,
    'select public.tournament_leaderboard($1, p_category => $2) as data',
    [id, categoryId],
    'anon',
  ).then(value)

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)', [
    root,
    'root@example.test',
    viewer,
    'viewer@example.test',
  ])
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  const role = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Consulta de torneos',
      ['torneos.ver'],
    ])
  ).rows[0].id
  await run(root, 'select public.admin_save_user($1,$2,true)', [viewer, [role]])
  cats.senior = await category('Senior')
  cats.cadetes = await category('Cadetes')
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('tournament categories', () => {
  it('keeps names unique, needs the manage permission and hides archived ones from new tournaments', async () => {
    await expect(category(' senior ')).rejects.toThrow()
    await expect(category('Damas', viewer)).rejects.toThrow()
    const damas = await category('Damas')
    await run(root, 'select public.tournament_category_archive($1,true)', [
      damas,
    ])
    await expect(tournament([damas])).rejects.toThrow(/archivada/)
    const listed = (
      await run(viewer, 'select public.tournament_category_list() as data')
    ).rows[0].data
    expect(listed.at(-1)).toMatchObject({ name: 'Damas' })
    expect(listed.at(-1).archived_at).not.toBeNull()
  })

  it('refuses to remove a category that already has participants', async () => {
    const id = await tournament([cats.senior, cats.cadetes])
    const ana = await person('Ana', 'Gómez', '20111222')
    await join(id, cats.cadetes, ana.id)
    const { updated_at } = (
      await run(root, 'select public.tournament_admin_get($1) as data', [id])
    ).rows[0].data
    await expect(
      run(root, 'select public.tournament_save($1,$2,$3)', [
        {
          name: 'Torneo por categorías',
          starts_on: '2026-12-05',
          start_time: '08:00',
          categories: [cats.senior],
        },
        id,
        updated_at,
      ]),
    ).rejects.toThrow(/participantes/)
  })
})

describe('people registry', () => {
  it('stores the DNI as digits, rejects duplicates and never exposes it to visitors', async () => {
    const saved = await person('Bruno', 'Díaz', '30.123.456')
    expect(saved).toMatchObject({ dni: '30123456', dni_masked: '••••3456' })
    await expect(person('Otro', 'Bruno', '30123456')).rejects.toThrow(/DNI/)
    await expect(person('Sin', 'Dni', '123')).rejects.toThrow(/7 u 8/)
    await expect(
      run(null, 'select dni from public.anglers', [], 'anon'),
    ).rejects.toThrow(/permission denied/)
    await expect(
      run(viewer, "select public.angler_search('bru') as data"),
    ).rejects.toThrow()
    const audit = await db.query(
      "select after_data->>'dni' as dni from public.audit_logs where action = 'anglers.insert' and resource_id = $1",
      [saved.id],
    )
    expect(audit.rows).toEqual([{ dni: '••••3456' }])
  })

  it('finds people by name prefix with a masked DNI and by full DNI', async () => {
    const byName = (
      await run(root, "select public.angler_search('díaz') as data")
    ).rows[0].data
    expect(byName).toEqual([
      expect.objectContaining({
        first_name: 'Bruno',
        dni: null,
        dni_masked: '••••3456',
      }),
    ])
    const byDni = (
      await run(root, "select public.angler_search('30123456') as data")
    ).rows[0].data
    expect(byDni.map((row) => row.first_name)).toEqual(['Bruno'])
    expect(
      (await run(root, 'select public.angler_get($1) as data', [byDni[0].id]))
        .rows[0].data.dni,
    ).toBe('30123456')
  })
})

describe('tournament entries', () => {
  it('ranks each category on its own and lets one person compete in several', async () => {
    const id = await tournament([cats.senior, cats.cadetes])
    const carla = await person('Carla', 'Ruiz', '40111222')
    const dario = await person('Darío', 'Sosa', '40111333')
    const carlaSenior = await join(id, cats.senior, carla.id)
    const carlaCadetes = await join(id, cats.cadetes, carla.id)
    const darioSenior = await join(id, cats.senior, dario.id)
    await expect(join(id, cats.senior, carla.id)).rejects.toThrow(/ya está/)
    await score(carlaSenior, 5)
    await score(darioSenior, 9)
    await score(carlaCadetes, 2)
    await run(root, 'select public.tournament_set_status($1,$2)', [
      id,
      'published',
    ])
    expect(
      (await board(id, cats.senior)).map((row) => [
        row.display_name,
        row.ranking,
      ]),
    ).toEqual([
      ['Darío S.', 1],
      ['Carla R.', 2],
    ])
    expect(
      (await board(id, cats.cadetes)).map((row) => [
        row.display_name,
        row.ranking,
      ]),
    ).toEqual([['Carla R.', 1]])
    const categories = (
      await run(
        null,
        'select public.tournament_board_categories($1) as data',
        [id],
        'anon',
      )
    ).rows[0].data
    expect(categories.map((row) => [row.name, row.participants])).toEqual([
      ['Cadetes', 1],
      ['Senior', 2],
    ])
  })

  it('changes the person or category of an entry, keeping its points', async () => {
    const id = await tournament([cats.senior, cats.cadetes])
    const wrong = await person('Elena', 'Paz', '50111222')
    const right = await person('Elisa', 'Paz', '50111333')
    const entry = await join(id, cats.senior, wrong.id)
    await score(entry, 7)
    await run(root, 'select public.tournament_change_participant($1,$2,true)', [
      entry,
      right.id,
    ])
    await run(root, 'select public.tournament_move_participant($1,$2)', [
      entry,
      cats.cadetes,
    ])
    const [row] = (
      await run(
        root,
        'select public.tournament_admin_participants($1, p_category => $2) as data',
        [id, cats.cadetes],
      )
    ).rows[0].data
    expect(row).toMatchObject({
      id: entry,
      display_name: 'Elisa P.',
      points: 7,
      angler_id: right.id,
      dni_masked: '••••1333',
    })
    await expect(
      run(root, 'select public.tournament_rename_participant($1,$2)', [
        entry,
        'Otro nombre',
      ]),
    ).rejects.toThrow(/datos de la persona/)
    await run(root, 'select public.angler_save($1,$2,$3)', [
      { first_name: 'Elisa', last_name: 'Quiroga', dni: '50111333' },
      right.id,
      (await run(root, 'select public.angler_get($1) as data', [right.id]))
        .rows[0].data.updated_at,
    ])
    expect(
      (
        await db.query(
          'select display_name from public.tournament_participants where id = $1',
          [entry],
        )
      ).rows[0].display_name,
    ).toBe('Elisa Q.')
  })

  it('links entries loaded before the registry to a person', async () => {
    const id = await tournament([cats.senior])
    const legacy = (
      await db.query(
        `insert into public.tournament_participants(tournament_id, category_id, display_name, consent_at, created_by)
         values ($1,$2,'Juan',now(),$3) returning id`,
        [id, cats.senior, root],
      )
    ).rows[0].id
    const juan = await person('Juan', 'Pérez', '60111222')
    await run(root, 'select public.tournament_change_participant($1,$2,true)', [
      legacy,
      juan.id,
    ])
    expect(
      (
        await db.query(
          'select display_name, angler_id from public.tournament_participants where id = $1',
          [legacy],
        )
      ).rows[0],
    ).toEqual({ display_name: 'Juan P.', angler_id: juan.id })
  })
})

describe('deleting tournaments', () => {
  it('deletes only archived tournaments, with their entries, points and event, keeping people', async () => {
    const id = await tournament([cats.senior])
    const fede = await person('Federico', 'Luna', '70111222')
    const entry = await join(id, cats.senior, fede.id)
    await score(entry, 4)
    const version = async () =>
      (await run(root, 'select public.tournament_admin_get($1) as data', [id]))
        .rows[0].data.updated_at
    await expect(
      run(root, 'select public.tournament_delete($1,$2)', [
        id,
        await version(),
      ]),
    ).rejects.toThrow(/Archivá/)
    await run(root, 'select public.tournament_set_status($1,$2)', [
      id,
      'archived',
    ])
    await expect(
      run(viewer, 'select public.tournament_delete($1,$2)', [
        id,
        await version(),
      ]),
    ).rejects.toThrow()
    await run(root, 'select public.tournament_delete($1,$2)', [
      id,
      await version(),
    ])
    const count = async (sql) => (await db.query(sql, [id])).rows[0].n
    expect(
      await count(
        'select count(*)::int as n from public.tournaments where id = $1',
      ),
    ).toBe(0)
    expect(
      await count(
        'select count(*)::int as n from public.tournament_participants where tournament_id = $1',
      ),
    ).toBe(0)
    expect(
      await count(
        'select count(*)::int as n from public.tournament_scores where tournament_id = $1',
      ),
    ).toBe(0)
    expect(
      await count(
        'select count(*)::int as n from public.events where tournament_id = $1',
      ),
    ).toBe(0)
    expect(
      (await db.query('select 1 from public.anglers where id = $1', [fede.id]))
        .rows,
    ).toHaveLength(1)
    expect(
      await count(
        "select count(*)::int as n from public.audit_logs where action = 'tournaments.delete' and resource_id = $1::text",
      ),
    ).toBe(1)
  })
})
