// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000010'
const member = '10000000-0000-4000-8000-000000000011'
const reading = {
  height_cm: 234,
  measured_at: '2026-01-01T13:30:00Z',
  station: 'Estación de prueba',
  source: 'Fuente de prueba',
  note: null,
  is_published: true,
}
async function run(role, user, sql, args = [], aal = 'aal2') {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({
        sub: user,
        aal,
        user_metadata: { role: 'super_admin' },
      }),
    ])
    return tx.query(sql, args)
  })
}
const save = (input, version = null) =>
  run(
    'authenticated',
    root,
    'select public.admin_save_river_level($1,$2) as row',
    [JSON.stringify(input), version],
  )
beforeAll(async () => {
  db = await createTestDatabase()
  await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)', [
    root,
    'root@example.test',
    member,
    'member@example.test',
  ])
  await db.query("select public.bootstrap_admin('root@example.test')")
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('river level authorization and publication', () => {
  it('allows only a live general administrator with MFA to manage the measurement', async () => {
    for (const [role, user, aal] of [
      ['anon', null, 'aal1'],
      ['authenticated', member, 'aal2'],
      ['authenticated', root, 'aal1'],
    ]) {
      await expect(
        run(role, user, 'select public.admin_get_river_level()', [], aal),
      ).rejects.toMatchObject({ code: '42501' })
      await expect(
        run(
          role,
          user,
          'select public.admin_save_river_level($1)',
          [JSON.stringify(reading)],
          aal,
        ),
      ).rejects.toMatchObject({ code: '42501' })
    }
    const result = await save(reading)
    expect(result.rows[0].row).toMatchObject({
      id: 1,
      height_cm: 234,
      is_published: true,
    })
    const audit = await db.query(
      "select actor_id,action from public.audit_logs where action = 'river_levels.insert'",
    )
    expect(audit.rows).toEqual([
      { actor_id: root, action: 'river_levels.insert' },
    ])
  })

  it.each([
    ['anon', null],
    ['authenticated', member],
    ['authenticated', root],
  ])(
    'exposes only published readings and denies direct writes to %s',
    async (role, user) => {
      const current = (
        await db.query('select updated_at from public.river_levels')
      ).rows[0]
      await save({ ...reading, is_published: false }, current.updated_at)
      expect(
        (await run(role, user, 'select id from public.river_levels')).rows,
      ).toEqual([])
      const next = (
        await db.query('select updated_at from public.river_levels')
      ).rows[0]
      await save(reading, next.updated_at)
      expect(
        (await run(role, user, 'select height_cm from public.river_levels'))
          .rows,
      ).toEqual([{ height_cm: 234 }])
      for (const sql of [
        'insert into public.river_levels default values',
        'update public.river_levels set is_published=false',
        'delete from public.river_levels',
      ])
        await expect(run(role, user, sql)).rejects.toMatchObject({
          code: '42501',
        })
    },
  )

  it('rejects stale edits, future dates and invalid data at the database boundary', async () => {
    const current = (
      await db.query('select updated_at from public.river_levels')
    ).rows[0]
    await expect(save(reading)).rejects.toMatchObject({ code: '40001' })
    await expect(
      save(
        { ...reading, measured_at: '2999-01-01T00:00:00Z' },
        current.updated_at,
      ),
    ).rejects.toMatchObject({ code: '22023' })
    await expect(
      save({ ...reading, height_cm: 10001 }, current.updated_at),
    ).rejects.toMatchObject({ code: '23514' })
    await expect(
      save({ ...reading, station: '' }, current.updated_at),
    ).rejects.toMatchObject({ code: '23514' })
    const next = (
      await save({ ...reading, height_cm: -29 }, current.updated_at)
    ).rows[0].row
    await expect(save(reading, current.updated_at)).rejects.toMatchObject({
      code: '40001',
    })
    expect(next.height_cm).toBe(-29)
  })

  it('reserves permission assignment and revokes management immediately on account deactivation', async () => {
    await expect(
      run('authenticated', root, 'select public.admin_save_role($1,$2)', [
        'No escalation',
        ['rio.gestionar'],
      ]),
    ).rejects.toMatchObject({ code: '42501' })
    await db.query(
      'update public.admin_accounts set active=false where id=$1',
      [root],
    )
    await expect(
      run('authenticated', root, 'select public.admin_get_river_level()'),
    ).rejects.toMatchObject({ code: '42501' })
    const policies = await db.query(
      "select cmd from pg_policies where tablename='river_levels' order by cmd",
    )
    expect(policies.rows.map((row) => row.cmd)).toEqual([
      'DELETE',
      'INSERT',
      'SELECT',
      'UPDATE',
    ])
    expect(
      (
        await db.query(
          "select rowsecurity from pg_tables where tablename='river_levels'",
        )
      ).rows[0].rowsecurity,
    ).toBe(true)
  })
})
