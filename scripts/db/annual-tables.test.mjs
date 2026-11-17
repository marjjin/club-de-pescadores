// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000070'
const viewer = '10000000-0000-4000-8000-000000000071'
const cats = {}
const people = {}

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
const anon = (sql, args = []) => run(null, sql, args, 'anon').then(value)
const annual = (name, year = 2026, user = root) =>
  run(user, 'select public.annual_table_save($1,$2) as id', [name, year]).then(
    value,
  )
const base = {
  name: 'Fecha anual',
  starts_on: '2026-03-01',
  start_time: '08:00',
}
const tournament = (extra) =>
  run(root, 'select public.tournament_save($1) as id', [
    { ...base, categories: [cats.mayores, cats.seniors], ...extra },
  ]).then(value)
const join = (id, category, angler) =>
  run(root, 'select public.tournament_add_participant($1,$2,$3,true) as id', [
    id,
    category,
    angler,
  ]).then(value)
const score = (entry, points) =>
  run(root, 'select public.tournament_add_points($1,$2)', [entry, points])
const status = (id, next) =>
  run(root, 'select public.tournament_set_status($1,$2)', [id, next])
const finish = async (id) => {
  await status(id, 'published')
  await status(id, 'finished')
}
const standings = (table, category) =>
  anon('select public.annual_standings($1,$2) as data', [table, category])

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
  for (const [key, name] of [
    ['mayores', 'Mayores'],
    ['seniors', 'Seniors'],
  ])
    cats[key] = await run(
      root,
      'select public.tournament_category_save($1) as id',
      [name],
    ).then(value)
  for (const [key, first_name, last_name, dni] of [
    ['ana', 'Ana', 'Gómez', '30111222'],
    ['beto', 'Beto', 'Ruiz', '30111333'],
  ])
    people[key] = (
      await run(root, 'select public.angler_save($1) as data', [
        { first_name, last_name, dni },
      ])
    ).rows[0].data.id
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('annual tables', () => {
  it('needs the manage permission and keeps names unique per year', async () => {
    await expect(annual('Copa de invierno', 2026, viewer)).rejects.toThrow()
    await annual('Copa de invierno')
    await expect(annual(' copa de invierno ')).rejects.toThrow()
    // The same name is fine for another season.
    await expect(annual('Copa de invierno', 2027)).resolves.toBeTruthy()
    await expect(
      anon('select count(*) from public.annual_tables'),
    ).rejects.toThrow()
  })

  it('adds up finished tournaments by person and category, never drafts or running ones', async () => {
    const table = await annual('Campeonato anual')
    const first = await tournament({ annual_table: table })
    const second = await tournament({ annual_table: table })
    const running = await tournament({ annual_table: table })
    const other = await tournament({})
    for (const id of [first, second, running, other]) {
      await score(await join(id, cats.mayores, people.ana), 10)
      await score(await join(id, cats.mayores, people.beto), 6)
    }
    // Beto also competes in Seniors: it is a table of its own.
    await score(await join(first, cats.seniors, people.beto), 4)
    await finish(first)
    await finish(second)
    await finish(other)
    await status(running, 'published')
    expect(await standings(table, cats.mayores)).toEqual([
      { display_name: 'Ana G.', points: 20, tournaments: 2, ranking: 1 },
      { display_name: 'Beto R.', points: 12, tournaments: 2, ranking: 2 },
    ])
    expect(await standings(table, cats.seniors)).toEqual([
      { display_name: 'Beto R.', points: 4, tournaments: 1, ranking: 1 },
    ])
    const detail = await anon('select public.annual_table_get($1) as data', [
      table,
    ])
    expect(detail.categories.map((entry) => entry.name)).toEqual([
      'Mayores',
      'Seniors',
    ])
    // Same date: only how many count matters here, not their order.
    expect(detail.tournaments.map((entry) => entry.finished).sort()).toEqual([
      false,
      true,
      true,
    ])
    // Nothing on the site identifies people beyond their public name.
    expect(JSON.stringify(detail)).not.toMatch(/3011/)
    expect(JSON.stringify(await standings(table, cats.mayores))).not.toMatch(
      /3011|angler/,
    )
  })

  it('lets each tournament choose which categories count and moves with edits', async () => {
    const table = await annual('Ranking de costa')
    const id = await tournament({
      annual_table: table,
      annual_categories: [cats.mayores],
    })
    await score(await join(id, cats.mayores, people.ana), 5)
    await score(await join(id, cats.seniors, people.ana), 9)
    await finish(id)
    expect(await standings(table, cats.seniors)).toEqual([])
    expect(await standings(table, cats.mayores)).toHaveLength(1)
    const saved = (
      await run(root, 'select public.tournament_admin_get($1) as data', [id])
    ).rows[0].data
    expect(saved).toMatchObject({
      annual_table_id: table,
      annual_table_name: 'Ranking de costa',
    })
    expect(
      Object.fromEntries(saved.categories.map((c) => [c.name, c.annual])),
    ).toEqual({ Mayores: true, Seniors: false })
    // Unlinking the tournament takes its points out of the table.
    await run(root, 'select public.tournament_save($1,$2,$3)', [
      { ...base, annual_table: '' },
      id,
      saved.updated_at,
    ])
    expect(await standings(table, cats.mayores)).toEqual([])
  })

  it('counts entries without a person for staff, and hides archived tables from the site', async () => {
    const table = await annual('Temporada vieja', 2025)
    const id = await tournament({ annual_table: table })
    await db.query(
      `insert into public.tournament_participants(tournament_id, category_id, display_name, consent_at, created_by)
       values ($1, $2, 'Carlos P.', now(), $3)`,
      [id, cats.mayores, root],
    )
    await finish(id)
    const listed = (
      await run(viewer, 'select public.annual_table_list() as data')
    ).rows[0].data.find((entry) => entry.id === table)
    expect(listed).toMatchObject({ tournaments: 1, finished: 1, unlinked: 1 })
    await run(root, 'select public.annual_table_archive($1,true)', [table])
    expect(
      await anon('select public.annual_table_get($1) as data', [table]),
    ).toBeNull()
    expect(
      (await anon('select public.annual_tables_public() as data')).some(
        (entry) => entry.id === table,
      ),
    ).toBe(false)
    // An archived table takes no new tournaments.
    await expect(tournament({ annual_table: table })).rejects.toThrow(
      /archivada/,
    )
  })
})
