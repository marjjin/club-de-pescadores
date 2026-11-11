// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000040'
const delegate = '10000000-0000-4000-8000-000000000041'
const newcomer = '10000000-0000-4000-8000-000000000042'
let systemRole
let readerRole
let eventsRole

async function run(user, sql, args = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated')
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: user, aal: 'aal2' }),
    ])
    return tx.query(sql, args)
  })
}
const saveRole = async (name, permissions) =>
  (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      name,
      permissions,
    ])
  ).rows[0].id
const version = async (id) =>
  (
    await db.query('select updated_at from public.admin_accounts where id=$1', [
      id,
    ])
  ).rows[0]?.updated_at ?? null

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query(
    'insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6)',
    [
      root,
      'root@example.test',
      delegate,
      'admin@example.test',
      newcomer,
      'nuevo@example.test',
    ],
  )
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  systemRole = (await db.query('select id from public.roles where is_system'))
    .rows[0].id
  const office = await saveRole('Administración', [
    'usuarios.ver',
    'usuarios.gestionar',
    'noticias.ver',
  ])
  readerRole = await saveRole('Lector de noticias', ['noticias.ver'])
  eventsRole = await saveRole('Eventos', ['eventos.ver', 'eventos.editar'])
  await run(root, 'select public.admin_save_user($1,$2,true)', [
    delegate,
    [office],
  ])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('section permissions', () => {
  it('makes users selectable, keeps roles reserved and drops the old river permission', async () => {
    const rows = (
      await db.query(
        "select id, reserved from public.permissions where id in ('usuarios.ver','usuarios.gestionar','roles.gestionar','rio.gestionar') order by id",
      )
    ).rows
    expect(rows).toEqual([
      { id: 'roles.gestionar', reserved: true },
      { id: 'usuarios.gestionar', reserved: false },
      { id: 'usuarios.ver', reserved: false },
    ])
    await expect(
      saveRole('Sin lectura', ['usuarios.gestionar']),
    ).rejects.toMatchObject({ code: '22023' })
  })

  it('tells the panel exactly which sections a delegate may open', async () => {
    const context = (await run(delegate, 'select public.admin_context() as c'))
      .rows[0].c
    expect(context).toMatchObject({ general: false, pier: false })
    expect(context.permissions).toEqual([
      'noticias.ver',
      'usuarios.gestionar',
      'usuarios.ver',
    ])
    const dashboard = (
      await run(delegate, 'select public.admin_dashboard() as d')
    ).rows[0].d
    expect(dashboard.news).not.toBeNull()
    expect(dashboard.events).toBeNull()
    expect(dashboard.users).not.toBeNull()
  })

  it('lists only the roles a delegate may grant', async () => {
    const roles = (
      await run(delegate, "select public.admin_list('roles') as items")
    ).rows[0].items.map((role) => role.id)
    expect(roles).toContain(readerRole)
    expect(roles).not.toContain(systemRole)
    expect(roles).not.toContain(eventsRole)
  })

  it('never lets user management escalate privileges', async () => {
    for (const roles of [[systemRole], [eventsRole], [readerRole, systemRole]])
      await expect(
        run(delegate, 'select public.admin_save_user($1,$2,true)', [
          newcomer,
          roles,
        ]),
      ).rejects.toMatchObject({ code: '42501' })
    await expect(
      run(delegate, 'select public.admin_invitation_target($1,$2)', [
        'otro@example.test',
        [systemRole],
      ]),
    ).rejects.toMatchObject({ code: '42501' })
    // A general administrator cannot be changed or disabled by a delegate.
    await expect(
      run(delegate, 'select public.admin_save_user($1,$2,false,$3)', [
        root,
        [readerRole],
        await version(root),
      ]),
    ).rejects.toMatchObject({ code: '42501' })
    await expect(
      run(delegate, 'select public.admin_save_user($1,$2,true,$3)', [
        delegate,
        [readerRole],
        await version(delegate),
      ]),
    ).rejects.toMatchObject({ code: '42501' })
  })

  it('lets a delegate give access within their own permissions', async () => {
    await run(delegate, 'select public.admin_save_user($1,$2,true)', [
      newcomer,
      [readerRole],
    ])
    const assigned = (
      await db.query('select role_id from public.user_roles where user_id=$1', [
        newcomer,
      ])
    ).rows
    expect(assigned).toEqual([{ role_id: readerRole }])
  })
})
