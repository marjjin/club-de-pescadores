// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000060'
const delegate = '10000000-0000-4000-8000-000000000061'
const retiredUser = '10000000-0000-4000-8000-000000000062'
const mixedUser = '10000000-0000-4000-8000-000000000063'
const existingUser = '10000000-0000-4000-8000-000000000064'
const newcomer = '10000000-0000-4000-8000-000000000065'
const legacyDelegate = '10000000-0000-4000-8000-000000000066'
const outsider = '10000000-0000-4000-8000-000000000067'
const roles = {}
const retiredPermissions = ['pileta.ver', 'porteria.ver', 'portería.ver']

async function run(user, sql, args = [], aal = 'aal2', role = 'authenticated') {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: user, aal }),
    ])
    return tx.query(sql, args)
  })
}
async function fixtureRole(name, permissions) {
  const id = (
    await db.query('insert into public.roles(name) values ($1) returning id', [
      name,
    ])
  ).rows[0].id
  await db.query(
    'insert into public.role_permissions(role_id,permission_id) select $1, unnest($2::text[])',
    [id, permissions],
  )
  return id
}
async function version(table, id) {
  return (
    await db.query(`select updated_at from public.${table} where id=$1`, [id])
  ).rows[0].updated_at
}
async function permissions(id) {
  return (
    await db.query(
      'select permission_id from public.role_permissions where role_id=$1 order by permission_id',
      [id],
    )
  ).rows.map((row) => row.permission_id)
}
async function assignments(id) {
  return (
    await db.query(
      'select role_id from public.user_roles where user_id=$1 order by role_id',
      [id],
    )
  ).rows.map((row) => row.role_id)
}

beforeAll(async () => {
  db = await createTestDatabase()
  for (const [id, email] of [
    [root, 'root@example.test'],
    [delegate, 'delegate@example.test'],
    [retiredUser, 'retired@example.test'],
    [mixedUser, 'mixed@example.test'],
    [existingUser, 'existing@example.test'],
    [newcomer, 'new@example.test'],
    [legacyDelegate, 'legacy-delegate@example.test'],
  ])
    await db.query('insert into auth.users(id,email) values ($1,$2)', [
      id,
      email,
    ])
  await db.query("select public.bootstrap_admin('root@example.test')")
  // These custom modules can exist remotely even though local migrations never
  // introduced them. Seed them as pre-existing data, not via the retired UI API.
  await db.exec(`insert into public.permissions(id,label) values
    ('pileta.ver','Control de pileta'), ('porteria.ver','Portería'),
    ('portería.ver','Portería histórica'), ('archivo.ver','Otro módulo')`)
  roles.pool = await fixtureRole('Legacy pool', ['pileta.ver'])
  roles.gate = await fixtureRole('Legacy gate', ['porteria.ver'])
  roles.accentedGate = await fixtureRole('Legacy accented gate', [
    'portería.ver',
  ])
  roles.rates = await fixtureRole('Legacy rates', ['tarifas.ver'])
  roles.mixed = await fixtureRole('Legacy mixed', [
    'noticias.ver',
    'pileta.ver',
  ])
  roles.empty = await fixtureRole('Legacy empty', [])
  roles.other = await fixtureRole('Legacy other', ['archivo.ver'])
  roles.reader = await fixtureRole('Reader', ['noticias.ver'])
  roles.delegate = await fixtureRole('Delegate', [
    'noticias.ver',
    'usuarios.ver',
    'usuarios.gestionar',
  ])
  for (const [id, assigned] of [
    [delegate, [roles.delegate]],
    [legacyDelegate, [roles.delegate, roles.pool]],
    [retiredUser, [roles.pool]],
    [mixedUser, [roles.mixed, roles.gate]],
    [existingUser, [roles.reader, roles.pool]],
  ]) {
    await db.query(
      'insert into public.admin_accounts(id,email) select id,email from auth.users where id=$1',
      [id],
    )
    await db.query(
      'insert into public.user_roles(user_id,role_id) select $1,unnest($2::uuid[])',
      [id, assigned],
    )
  }
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('retired operational roles', () => {
  it('hides retired-only roles while keeping mixed, empty, system and unrelated roles', async () => {
    const list = (
      await run(
        root,
        "select public.admin_list('roles',null,null,'all','Legacy ') as items",
      )
    ).rows[0].items
    expect(list.map((role) => role.id).sort()).toEqual(
      [roles.empty, roles.mixed, roles.other, roles.rates].sort(),
    )
    expect(list.find((role) => role.id === roles.mixed).permissions).toEqual([
      'noticias.ver',
    ])
    expect(list.find((role) => role.id === roles.other).permissions).toEqual([
      'archivo.ver',
    ])
    const system = (
      await run(
        root,
        "select public.admin_list('roles',null,null,'all','Administrador general') as items",
      )
    ).rows[0].items
    expect(system).toHaveLength(1)
    expect(system[0].is_system).toBe(true)
    expect(
      (
        await db.query('select id from public.roles where id=any($1::uuid[])', [
          [roles.pool, roles.gate, roles.rates, roles.accentedGate],
        ])
      ).rows,
    ).toHaveLength(4)
  })

  it('returns only current panel permissions and role labels without revoking historical permissions', async () => {
    const catalog = (
      await run(root, 'select public.admin_permissions() as items')
    ).rows[0].items.map((permission) => permission.id)
    for (const permission of retiredPermissions)
      expect(catalog).not.toContain(permission)
    expect(catalog).toContain('archivo.ver')
    expect(catalog).toContain('tarifas.ver')
    const general = (await run(root, 'select public.admin_context() as item'))
      .rows[0].item
    expect(general.general).toBe(true)
    expect(general.permissions).toContain('tarifas.ver')
    for (const permission of retiredPermissions)
      expect(general.permissions).not.toContain(permission)
    const mixed = (
      await run(mixedUser, 'select public.admin_context() as item')
    ).rows[0].item
    expect(mixed.permissions).toEqual(['noticias.ver'])
    expect(mixed.roles).toEqual(['Legacy mixed'])
    const retired = (
      await run(retiredUser, 'select public.admin_context() as item')
    ).rows[0].item
    expect(retired).toMatchObject({ active: true, permissions: [], roles: [] })
    expect(
      (
        await run(
          retiredUser,
          "select public.has_permission('pileta.ver') as allowed",
        )
      ).rows[0].allowed,
    ).toBe(true)
  })

  it('filters roles before search, ordering and the page limit', async () => {
    await db.exec(`with inserted as (
      insert into public.roles(name,created_at)
      select 'Page retired ' || n, '2030-01-01'::timestamptz + (n * 2) * interval '1 minute'
      from generate_series(1,35) n returning id
    ) insert into public.role_permissions(role_id,permission_id) select id,'pileta.ver' from inserted;
    with inserted as (
      insert into public.roles(name,created_at)
      select 'Page visible ' || n, '2030-01-01'::timestamptz + (n * 2 - 1) * interval '1 minute'
      from generate_series(1,23) n returning id
    ) insert into public.role_permissions(role_id,permission_id) select id,'noticias.ver' from inserted`)
    const expected = (
      await db.query(
        "select id from public.roles where starts_with(name,'Page visible ') order by created_at desc,id desc",
      )
    ).rows.map((row) => row.id)
    const first = (
      await run(
        root,
        "select public.admin_list('roles',null,null,'all','Page ') as items",
      )
    ).rows[0].items
    expect(first).toHaveLength(21)
    expect(first.map((role) => role.id)).toEqual(expected.slice(0, 21))
    const cursor = first[19]
    const second = (
      await run(
        root,
        "select public.admin_list('roles',$1,$2,'all','Page ') as items",
        [cursor.created_at, cursor.id],
      )
    ).rows[0].items
    expect(second.map((role) => role.id)).toEqual(expected.slice(20))
    const delegated = (
      await run(
        delegate,
        "select public.admin_list('roles',null,null,'all','Legacy ') as items",
      )
    ).rows[0].items
    expect(delegated.map((role) => role.id)).toEqual([roles.empty])
  })

  it('preserves retired permissions when editing the visible part of a mixed role', async () => {
    const id = await fixtureRole('Editable mixed', [
      'noticias.ver',
      'noticias.archivar',
      'pileta.ver',
      'tarifas.ver',
    ])
    await run(root, 'select public.admin_save_role($1,$2,$3,$4)', [
      'Edited mixed',
      ['noticias.ver', 'noticias.editar', 'tarifas.ver'],
      id,
      await version('roles', id),
    ])
    expect(await permissions(id)).toEqual([
      'noticias.editar',
      'noticias.ver',
      'pileta.ver',
      'tarifas.ver',
    ])
    const audits = (
      await run(
        root,
        "select public.admin_list('audit',null,null,'all','roles.') as items",
      )
    ).rows[0].items
    expect(
      audits.some(
        (entry) => entry.resource_id === id && entry.action === 'roles.update',
      ),
    ).toBe(true)
  })

  it.each(retiredPermissions)(
    'rejects newly requested permission %s, even for general administrators',
    async (permission) => {
      await expect(
        run(root, 'select public.admin_save_role($1,$2)', [
          'Retired request',
          [permission],
        ]),
      ).rejects.toMatchObject({ code: '42501' })
      await expect(
        run(root, 'select public.admin_save_role($1,$2,$3,$4)', [
          'Legacy mixed',
          ['noticias.ver', permission],
          roles.mixed,
          await version('roles', roles.mixed),
        ]),
      ).rejects.toMatchObject({ code: '42501' })
      expect(await permissions(roles.mixed)).toEqual([
        'noticias.ver',
        'pileta.ver',
      ])
    },
  )

  it('keeps complete user assignments when authorized administrators edit a legacy account', async () => {
    const before = await assignments(existingUser)
    const users = (
      await run(
        root,
        "select public.admin_list('users',null,null,'all','existing@') as items",
      )
    ).rows[0].items
    expect(users[0].roles).toEqual(before)
    for (const user of [root, legacyDelegate]) {
      await run(user, 'select public.admin_save_user($1,$2,$3,$4)', [
        existingUser,
        users[0].roles,
        user === legacyDelegate,
        await version('admin_accounts', existingUser),
      ])
      expect(await assignments(existingUser)).toEqual(before)
    }
    const target = (
      await run(
        legacyDelegate,
        'select public.admin_invitation_target($1,$2) as item',
        ['existing@example.test', before],
      )
    ).rows[0].item
    expect(target).toMatchObject({
      existing_id: existingUser,
      registered: true,
    })
  })

  it('rejects new retired-role assignments before either account updates or invitations', async () => {
    for (const user of [root, delegate, legacyDelegate]) {
      for (const role of [roles.pool, roles.gate, roles.accentedGate]) {
        await expect(
          run(user, 'select public.admin_save_user($1,$2,true)', [
            newcomer,
            [roles.reader, role],
          ]),
        ).rejects.toMatchObject({ code: '42501' })
        await expect(
          run(user, 'select public.admin_invitation_target($1,$2)', [
            'new@example.test',
            [role],
          ]),
        ).rejects.toMatchObject({ code: '42501' })
      }
    }
    expect(await assignments(newcomer)).toEqual([])
    await run(root, 'select public.admin_save_user($1,$2,true)', [
      newcomer,
      [roles.mixed],
    ])
    expect(await assignments(newcomer)).toEqual([roles.mixed])
  })

  it('keeps rate permissions available, assignable and dependent on their view permission', async () => {
    await expect(
      run(root, 'select public.admin_save_role($1,$2)', [
        'Rates without view',
        ['tarifas.editar'],
      ]),
    ).rejects.toMatchObject({ code: '22023' })
    const allowed = [
      'tarifas.ver',
      'tarifas.editar',
      'tarifas.publicar',
      'tarifas.archivar',
    ]
    const id = (
      await run(root, 'select public.admin_save_role($1,$2) as id', [
        'Current rates',
        allowed,
      ])
    ).rows[0].id
    expect(await permissions(id)).toEqual([...allowed].sort())
    await run(root, 'select public.admin_save_user($1,$2,true,$3)', [
      newcomer,
      [id, roles.rates],
      await version('admin_accounts', newcomer),
    ])
    expect(await assignments(newcomer)).toEqual([id, roles.rates].sort())
    const context = (
      await run(newcomer, 'select public.admin_context() as item')
    ).rows[0].item
    expect(context.permissions).toEqual([...allowed].sort())
    expect(context.roles).toEqual(['Current rates', 'Legacy rates'])
  })

  it('retains dashboard rate counts, draft totals, the rate listing and public data', async () => {
    const before = (await run(root, 'select public.admin_dashboard() as item'))
      .rows[0].item
    const inserted =
      await db.query(`insert into public.pool_rates(season,period,family_price_cents,individual_price_cents,family_description,valid_from,is_published)
      select 'Preserved rates ' || n,'Verano',100,50,'Familia','2030-01-01',n=1 from generate_series(1,3) n returning id`)
    const after = (await run(root, 'select public.admin_dashboard() as item'))
      .rows[0].item
    expect(after.rates).toBe(before.rates + 1)
    expect(after.drafts).toBe(before.drafts + 2)
    const rates = (
      await run(
        newcomer,
        "select public.admin_list('pool_rates',null,null,'all','Preserved rates') as items",
      )
    ).rows[0].items
    expect(rates).toHaveLength(3)
    const publicRates = (
      await run(
        null,
        'select id from public.pool_rates where id=any($1::uuid[])',
        [inserted.rows.map((row) => row.id)],
        'aal1',
        'anon',
      )
    ).rows
    expect(publicRates).toHaveLength(1)
    const audit = (
      await run(
        root,
        "select public.admin_list('audit',null,null,'all','pool_rates.') as items",
      )
    ).rows[0].items
    expect(audit).toHaveLength(3)
  })

  it('keeps anonymous, unprivileged and non-MFA callers out of privileged catalogs and mutations', async () => {
    for (const sql of [
      "select public.admin_list('roles')",
      'select public.admin_permissions()',
      'select public.admin_dashboard()',
      "select public.admin_save_role('Unauthorized',array['noticias.ver'])",
    ]) {
      await expect(run(null, sql, [], 'aal1', 'anon')).rejects.toMatchObject({
        code: '42501',
      })
      await expect(run(outsider, sql)).rejects.toMatchObject({
        code: '42501',
      })
      await expect(run(root, sql, [], 'aal1')).rejects.toMatchObject({
        code: '42501',
      })
    }
    await expect(
      run(null, 'select public.admin_context()', [], 'aal1', 'anon'),
    ).rejects.toMatchObject({ code: '42501' })
    await expect(
      run(root, "select private.is_panel_permission('noticias.ver')"),
    ).rejects.toMatchObject({ code: '42501' })
    await expect(
      run(root, 'select private.is_panel_role($1)', [roles.pool]),
    ).rejects.toMatchObject({ code: '42501' })
    await expect(
      run(delegate, 'select public.admin_save_user($1,$2,true,$3)', [
        root,
        [roles.reader],
        await version('admin_accounts', root),
      ]),
    ).rejects.toMatchObject({ code: '42501' })
    await expect(
      run(delegate, 'select public.admin_save_user($1,$2,true,$3)', [
        existingUser,
        [roles.mixed, roles.pool],
        await version('admin_accounts', existingUser),
      ]),
    ).rejects.toMatchObject({ code: '42501' })
  })

  it('never lets a delegate reactivate existing retired permissions that they do not hold', async () => {
    const assigned = await assignments(existingUser)
    await run(root, 'select public.admin_save_user($1,$2,false,$3)', [
      existingUser,
      assigned,
      await version('admin_accounts', existingUser),
    ])
    await expect(
      run(delegate, 'select public.admin_save_user($1,$2,true,$3)', [
        existingUser,
        assigned,
        await version('admin_accounts', existingUser),
      ]),
    ).rejects.toMatchObject({ code: '42501' })
    await expect(
      run(delegate, 'select public.admin_invitation_target($1,$2)', [
        'existing@example.test',
        assigned,
      ]),
    ).rejects.toMatchObject({ code: '42501' })
    expect(await assignments(existingUser)).toEqual(assigned)
    expect(
      (
        await db.query('select active from public.admin_accounts where id=$1', [
          existingUser,
        ])
      ).rows[0].active,
    ).toBe(false)
  })
})
