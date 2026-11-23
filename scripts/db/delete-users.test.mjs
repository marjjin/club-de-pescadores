// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000030'
const editor = '10000000-0000-4000-8000-000000000031'
const manager = '10000000-0000-4000-8000-000000000032'
const viewer = '10000000-0000-4000-8000-000000000033'
const general = '10000000-0000-4000-8000-000000000034'
const roles = {}

async function run(user, sql, args = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated')
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: user, aal: 'aal2' }),
    ])
    return tx.query(sql, args)
  })
}
const account = async (id) =>
  (
    await db.query(
      'select email, active, deleted_at, updated_at from public.admin_accounts where id=$1',
      [id],
    )
  ).rows[0]
const remove = async (caller, id) =>
  run(caller, 'select public.admin_delete_user($1,$2)', [
    id,
    (await account(id)).updated_at,
  ])
const listedEmails = async () =>
  (
    await run(root, "select public.admin_list('users') as rows")
  ).rows[0].rows.map((row) => row.email)

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query(
    'insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6),($7,$8),($9,$10)',
    [
      root,
      'root@example.test',
      editor,
      'editor@example.test',
      manager,
      'manager@example.test',
      viewer,
      'viewer@example.test',
      general,
      'general@example.test',
    ],
  )
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  const save = async (name, permissions) =>
    (
      await run(root, 'select public.admin_save_role($1,$2) as id', [
        name,
        permissions,
      ])
    ).rows[0].id
  roles.editor = await save('Editor', ['noticias.ver', 'noticias.editar'])
  roles.manager = await save('Gestión de equipo', [
    'usuarios.ver',
    'usuarios.gestionar',
  ])
  roles.viewer = await save('Consulta de equipo', ['usuarios.ver'])
  roles.system = (
    await db.query('select id from public.roles where is_system')
  ).rows[0].id
  for (const [id, role] of [
    [editor, roles.editor],
    [manager, roles.manager],
    [viewer, roles.viewer],
    [general, roles.system],
  ])
    await run(root, 'select public.admin_save_user($1,$2,true)', [id, [role]])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('administrative user deletion', () => {
  it('rejects self-deletion, stale versions and callers without permission', async () => {
    await expect(remove(root, root)).rejects.toThrow(/Otro administrador/)
    await expect(remove(editor, viewer)).rejects.toThrow()
    await expect(
      run(root, 'select public.admin_delete_user($1,$2)', [
        viewer,
        '2000-01-01T00:00:00Z',
      ]),
    ).rejects.toThrow(/cambió/)
    await expect(
      db.transaction(async (tx) => {
        await tx.exec('set local role anon')
        return tx.query('select public.admin_delete_user($1,now())', [viewer])
      }),
    ).rejects.toThrow(/permission denied/)
    expect((await account(viewer)).deleted_at).toBeNull()
  })

  it('lets managers edit only accounts whose current access they could have granted', async () => {
    // Stripping roles or deactivating is as sensitive as deleting.
    await expect(
      run(manager, 'select public.admin_save_user($1,$2,false,$3)', [
        editor,
        [roles.viewer],
        (await account(editor)).updated_at,
      ]),
    ).rejects.toThrow(/permisos que ya tenés/)
    expect((await account(editor)).active).toBe(true)
    const editorRoles = await db.query(
      'select role_id from public.user_roles where user_id=$1',
      [editor],
    )
    expect(editorRoles.rows).toEqual([{ role_id: roles.editor }])
  })

  it('lets managers delete only accounts whose access they could have granted', async () => {
    await expect(remove(manager, general)).rejects.toThrow(/Solo podés/)
    await expect(remove(manager, editor)).rejects.toThrow(/permisos/)
    await remove(manager, viewer)
    expect((await account(viewer)).deleted_at).not.toBeNull()
  })

  it('anonymizes the account, revokes access and keeps its authorship and audit trail', async () => {
    await db.query(
      'insert into public.pier_reports(height_cm, measured_at, created_by) values (250, now(), $1)',
      [editor],
    )
    await remove(root, editor)
    const deleted = await account(editor)
    expect(deleted).toMatchObject({ email: null, active: false })
    expect(deleted.deleted_at).not.toBeNull()
    expect(
      (
        await db.query('select 1 from public.user_roles where user_id=$1', [
          editor,
        ])
      ).rows,
    ).toHaveLength(0)
    expect(
      (
        await db.query(
          'select count(*)::int as n from public.pier_reports where created_by=$1',
          [editor],
        )
      ).rows[0].n,
    ).toBe(1)
    expect(
      (await run(editor, "select public.has_permission('noticias.ver') as ok"))
        .rows[0].ok,
    ).toBe(false)
    const audit = (
      await db.query(
        "select before_data->>'email' as email from public.audit_logs where action='admin_accounts.update' and resource_id=$1 and after_data->>'deleted_at' is not null",
        [editor],
      )
    ).rows
    expect(audit).toEqual([{ email: 'editor@example.test' }])
    expect(await listedEmails()).not.toContain('editor@example.test')
    expect(await listedEmails()).not.toContain(null)
  })

  it('never edits, re-deletes or renames a deleted account', async () => {
    await expect(remove(root, editor)).rejects.toThrow(/no existe/)
    await expect(
      run(root, 'select public.admin_save_user($1,$2,true,$3)', [
        editor,
        [roles.editor],
        (await account(editor)).updated_at,
      ]),
    ).rejects.toThrow(/eliminado/)
    // Auth can still hold the user when its deletion failed after the RPC.
    await db.query('update auth.users set email=$1 where id=$2', [
      'renamed@example.test',
      editor,
    ])
    expect((await account(editor)).email).toBeNull()
  })

  it('lets a general administrator delete another one while one stays active', async () => {
    await remove(root, general)
    expect((await account(general)).deleted_at).not.toBeNull()
    expect((await account(root)).active).toBe(true)
  })
})
