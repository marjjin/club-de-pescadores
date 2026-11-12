// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000040'
const organizer = '10000000-0000-4000-8000-000000000041'
const editor = '10000000-0000-4000-8000-000000000042'
const scorer = '10000000-0000-4000-8000-000000000043'

async function run(user, sql, args = [], role = 'authenticated') {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(user ? { sub: user, aal: 'aal2' } : {}),
    ])
    return tx.query(sql, args)
  })
}
const anon = (sql, args) => run(null, sql, args, 'anon')
const create = (user, data = {}) =>
  run(user, 'select public.tournament_save($1) as id', [
    { name: 'Torneo de pejerrey', starts_on: '2026-12-05', ...data },
  ]).then((result) => result.rows[0].id)
const join = (user, tournament, name, consent = true) =>
  run(user, 'select public.tournament_add_participant($1,$2,$3) as id', [
    tournament,
    name,
    consent,
  ]).then((result) => result.rows[0].id)
const score = (user, participant, points, reason = null) =>
  run(user, 'select public.tournament_add_points($1,$2,$3) as total', [
    participant,
    points,
    reason,
  ]).then((result) => result.rows[0].total)
const status = (user, tournament, value) =>
  run(user, 'select public.tournament_set_status($1,$2)', [tournament, value])
const board = (tournament, cursor = [null, null, null]) =>
  anon('select public.tournament_leaderboard($1,$2,$3,$4) as data', [
    tournament,
    ...cursor,
  ]).then((result) => result.rows[0].data)

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query(
    'insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6),($7,$8)',
    [
      root,
      'root@example.test',
      organizer,
      'organizer@example.test',
      editor,
      'editor@example.test',
      scorer,
      'scorer@example.test',
    ],
  )
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  const organizerRole = (
    await db.query("select id from public.roles where name='Torneo'")
  ).rows[0].id
  const editorRole = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Editor',
      ['noticias.ver', 'noticias.editar'],
    ])
  ).rows[0].id
  const scorerRole = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Fiscal',
      ['torneos.ver', 'torneos.puntos'],
    ])
  ).rows[0].id
  for (const [user, role] of [
    [organizer, organizerRole],
    [editor, editorRole],
    [scorer, scorerRole],
  ])
    await run(root, 'select public.admin_save_user($1,$2,true)', [user, [role]])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('tournaments', () => {
  it('ships a Torneo role with exactly the four tournament permissions', async () => {
    const { rows } = await db.query(
      `select array_agg(rp.permission_id order by rp.permission_id) as ids
       from public.role_permissions rp join public.roles r on r.id = rp.role_id where r.name = 'Torneo'`,
    )
    expect(rows[0].ids).toEqual([
      'torneos.gestionar',
      'torneos.participantes',
      'torneos.puntos',
      'torneos.ver',
    ])
  })

  it('refuses tournament roles without the view permission', async () => {
    await expect(
      run(root, 'select public.admin_save_role($1,$2)', [
        'Solo puntos',
        ['torneos.puntos'],
      ]),
    ).rejects.toThrow('lectura del módulo')
  })

  it('lets only the right permission create, register and score', async () => {
    await expect(create(editor)).rejects.toThrow('Acceso no autorizado')
    await expect(create(scorer)).rejects.toThrow('Acceso no autorizado')
    await expect(
      anon('select public.tournament_save($1)', [
        { name: 'Intruso', starts_on: '2026-12-05' },
      ]),
    ).rejects.toThrow('permission denied')
    const tournament = await create(organizer)
    await expect(join(scorer, tournament, 'Ana')).rejects.toThrow(
      'Acceso no autorizado',
    )
    const ana = await join(organizer, tournament, 'Ana')
    await expect(score(editor, ana, 5)).rejects.toThrow('Acceso no autorizado')
    expect(await score(scorer, ana, 5, 'Pieza de 40 cm')).toBe(5)
    expect(await score(organizer, ana, -2, 'Corrección')).toBe(3)
    const ledger = await db.query(
      'select points, reason, created_by from public.tournament_scores where participant_id=$1 order by created_at, points',
      [ana],
    )
    expect(ledger.rows.map((row) => row.points).sort()).toEqual([-2, 5])
    const audit = await db.query(
      "select count(*)::int as n from public.audit_logs where action = 'tournament_scores.insert'",
    )
    expect(audit.rows[0].n).toBeGreaterThanOrEqual(2)
  })

  it('requires consent and rejects invalid points', async () => {
    const tournament = await create(organizer)
    await expect(join(organizer, tournament, 'Beto', false)).rejects.toThrow(
      'aceptar aparecer',
    )
    const beto = await join(organizer, tournament, 'Beto')
    await expect(join(organizer, tournament, ' beto ')).rejects.toThrow()
    for (const points of [0, 1001, -1001])
      await expect(score(organizer, beto, points)).rejects.toThrow(
        'distinto de cero',
      )
  })

  it('hides drafts and archived tournaments from visitors', async () => {
    const tournament = await create(organizer, { name: 'Borrador oculto' })
    const ana = await join(organizer, tournament, 'Ana')
    await score(organizer, ana, 10)
    expect(await board(tournament)).toEqual([])
    await expect(
      anon('select id from public.tournaments where id=$1', [tournament]),
    ).resolves.toMatchObject({ rows: [] })
    await status(organizer, tournament, 'published')
    expect((await board(tournament)).map((row) => row.display_name)).toEqual([
      'Ana',
    ])
    await status(organizer, tournament, 'archived')
    expect(await board(tournament)).toEqual([])
  })

  it('never exposes who loaded data, consent dates or the ledger to visitors', async () => {
    await expect(
      anon('select created_by from public.tournaments limit 1'),
    ).rejects.toThrow('permission denied')
    await expect(
      anon('select consent_at from public.tournament_participants limit 1'),
    ).rejects.toThrow('permission denied')
    await expect(
      anon('select id from public.tournament_scores limit 1'),
    ).rejects.toThrow('permission denied')
    await expect(
      anon(
        "insert into public.tournament_participants(tournament_id, display_name, consent_at, created_by) values (gen_random_uuid(),'X',now(),gen_random_uuid())",
      ),
    ).rejects.toThrow('permission denied')
  })

  it('ranks ties in a shared position and pages with a cursor', async () => {
    const tournament = await create(organizer, { name: 'Ranking' })
    const ids = {}
    for (const [name, points] of [
      ['Carla', 8],
      ['Ana', 10],
      ['Bruno', 8],
      ['Diego', 3],
    ]) {
      ids[name] = await join(organizer, tournament, name)
      await score(organizer, ids[name], points)
    }
    await status(organizer, tournament, 'published')
    const rows = await board(tournament)
    expect(rows.map((row) => [row.display_name, row.ranking])).toEqual([
      ['Ana', 1],
      ['Bruno', 2],
      ['Carla', 2],
      ['Diego', 4],
    ])
    const bruno = rows[1]
    const after = await board(tournament, [bruno.points, 'Bruno', bruno.id])
    expect(after.map((row) => row.display_name)).toEqual(['Carla', 'Diego'])
    await run(organizer, 'select public.tournament_remove_participant($1)', [
      ids.Ana,
    ])
    expect((await board(tournament))[0]).toMatchObject({
      display_name: 'Bruno',
      ranking: 1,
    })
  })

  it('freezes participants and points once the tournament is finished', async () => {
    const tournament = await create(organizer, { name: 'Finalizado' })
    const ana = await join(organizer, tournament, 'Ana')
    await status(organizer, tournament, 'finished')
    await expect(score(organizer, ana, 1)).rejects.toThrow('finalizado')
    await expect(join(organizer, tournament, 'Beto')).rejects.toThrow(
      'finalizado',
    )
    expect(await board(tournament)).toHaveLength(1)
  })

  it('lists tournaments and participants in the panel only with the view permission', async () => {
    await expect(
      run(editor, 'select public.tournament_admin_list()'),
    ).rejects.toThrow('Acceso no autorizado')
    const list = await run(
      scorer,
      'select public.tournament_admin_list() as data',
    )
    expect(list.rows[0].data.length).toBeGreaterThan(0)
    expect(list.rows[0].data[0]).toHaveProperty('participants')
    const tournament = list.rows[0].data[0].id
    const people = await run(
      scorer,
      'select public.tournament_admin_participants($1,$2) as data',
      [tournament, ''],
    )
    expect(Array.isArray(people.rows[0].data)).toBe(true)
  })

  it('rejects stale edits of a tournament', async () => {
    const tournament = await create(organizer, { name: 'Versionado' })
    await expect(
      run(organizer, 'select public.tournament_save($1,$2,$3)', [
        { name: 'Versionado 2', starts_on: '2026-12-05' },
        tournament,
        '2000-01-01T00:00:00Z',
      ]),
    ).rejects.toThrow('cambió')
  })
})
