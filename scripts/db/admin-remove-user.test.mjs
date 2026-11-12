// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000050'
const manager = '10000000-0000-4000-8000-000000000051'
const editor = '10000000-0000-4000-8000-000000000052'
const second = '10000000-0000-4000-8000-000000000053'
let systemRole
let editorRole
let managerRole

async function run(user, sql, args = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated')
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: user, aal: 'aal2' }),
    ])
    return tx.query(sql, args)
  })
}
const version = async (id) =>
  (
    await db.query('select updated_at from public.admin_accounts where id=$1', [
      id,
    ])
  ).rows[0].updated_at
const remove = async (actor, id) =>
  run(actor, 'select public.admin_remove_user($1,$2)', [id, await version(id)])
const listed = async () =>
  (
    await run(root, "select public.admin_list('users') as items")
  ).rows[0].items.map((row) => row.email)

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query(
    'insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6),($7,$8)',
    [
      root,
      'root@example.test',
      manager,
      'manager@example.test',
      editor,
      'editor@example.test',
      second,
      'second@example.test',
    ],
  )
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  systemRole = (await db.query('select id from public.roles where is_system'))
    .rows[0].id
  editorRole = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Editor',
      ['noticias.ver', 'noticias.editar'],
    ])
  ).rows[0].id
  managerRole = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Gestor',
      ['usuarios.ver', 'usuarios.gestionar', 'noticias.ver', 'noticias.editar'],
    ])
  ).rows[0].id
  for (const [user, role] of [
    [manager, managerRole],
    [editor, editorRole],
  ])
    await run(root, 'select public.admin_save_user($1,$2,true)', [user, [role]])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('removing a user from the team', () => {
  it('removes access and roles, hides the account and keeps it for history', async () => {
    await remove(manager, editor)
    const account = (
      await db.query(
        'select active, deleted_at, email from public.admin_accounts where id=$1',
        [editor],
      )
    ).rows[0]
    expect(account).toMatchObject({
      active: false,
      email: 'editor@example.test',
    })
    expect(account.deleted_at).not.toBeNull()
    expect(
      (
        await db.query(
          'select count(*)::int as n from public.user_roles where user_id=$1',
          [editor],
        )
      ).rows[0].n,
    ).toBe(0)
    expect(await listed()).not.toContain('editor@example.test')
    const context = (await run(editor, 'select public.admin_context() as c'))
      .rows[0].c
    expect(context).toMatchObject({ active: false, permissions: [], roles: [] })
    const audit = await db.query(
      "select count(*)::int as n from public.audit_logs where action = 'admin_accounts.update' and resource_id = $1",
      [editor],
    )
    expect(audit.rows[0].n).toBeGreaterThan(0)
  })

  it('restores the same account when the e-mail is invited again', async () => {
    const target = await run(
      manager,
      'select public.admin_invitation_target($1,$2) as t',
      ['editor@example.test', [editorRole]],
    )
    expect(target.rows[0].t).toMatchObject({
      existing_id: editor,
      registered: false,
    })
    await run(manager, 'select public.admin_save_user($1,$2,true)', [
      editor,
      [editorRole],
    ])
    expect(await listed()).toContain('editor@example.test')
    expect(
      (await run(editor, 'select public.admin_context() as c')).rows[0].c
        .active,
    ).toBe(true)
  })

  it('never lets a stale editor restore a removed account', async () => {
    const stale = await version(editor)
    await remove(manager, editor)
    await expect(
      run(manager, 'select public.admin_save_user($1,$2,true,$3)', [
        editor,
        [editorRole],
        stale,
      ]),
    ).rejects.toThrow('No existe el usuario')
    await run(manager, 'select public.admin_save_user($1,$2,true)', [
      editor,
      [editorRole],
    ])
  })

  it('refuses self-removal, missing permission and stale versions', async () => {
    await expect(remove(manager, manager)).rejects.toThrow('quitar tu acceso')
    await expect(remove(editor, manager)).rejects.toThrow(
      'Acceso no autorizado',
    )
    await expect(
      run(manager, 'select public.admin_remove_user($1,$2)', [
        editor,
        '2000-01-01T00:00:00Z',
      ]),
    ).rejects.toThrow('cambió')
  })

  it('protects general administrators and always keeps one active', async () => {
    await expect(remove(manager, root)).rejects.toThrow(
      'administrador general puede modificar',
    )
    await run(root, 'select public.admin_save_user($1,$2,true)', [
      second,
      [systemRole],
    ])
    await remove(second, root)
    // The only general left cannot be removed by anyone.
    await expect(remove(manager, second)).rejects.toThrow()
    expect(
      await db.query(
        'select count(*)::int as n from public.admin_accounts a join public.user_roles ur on ur.user_id = a.id join public.roles r on r.id = ur.role_id where a.active and r.is_system',
      ),
    ).toMatchObject({ rows: [{ n: 1 }] })
  })
})
