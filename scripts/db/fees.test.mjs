// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000050'
const editor = '10000000-0000-4000-8000-000000000051'
const viewer = '10000000-0000-4000-8000-000000000052'
const other = '10000000-0000-4000-8000-000000000053'

async function run(user, sql, args = [], role = 'authenticated') {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: user, aal: 'aal2' }),
    ])
    return tx.query(sql, args)
  })
}
const current = async (user = editor) =>
  (await run(user, 'select public.admin_get_fees() as data')).rows[0].data
const save = async (user, change) => {
  const schedule = await current(root)
  return run(user, 'select public.admin_save_fees($1,$2) as data', [
    change(schedule),
    schedule.updated_at,
  ])
}

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query(
    'insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6),($7,$8)',
    [
      root,
      'root@example.test',
      editor,
      'editor@example.test',
      viewer,
      'viewer@example.test',
      other,
      'other@example.test',
    ],
  )
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  const seeded = (
    await db.query(
      "select id from public.roles where name = 'Tarifas del club'",
    )
  ).rows[0].id
  const reading = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Consulta de tarifas',
      ['cuotas.ver'],
    ])
  ).rows[0].id
  const news = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Noticias',
      ['noticias.ver', 'noticias.editar'],
    ])
  ).rows[0].id
  for (const [id, roleId] of [
    [editor, seeded],
    [viewer, reading],
    [other, news],
  ])
    await run(root, 'select public.admin_save_user($1,$2,true)', [id, [roleId]])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('club fees', () => {
  it('ships the ready-made role with both permissions', async () => {
    const { rows } = await db.query(
      `select rp.permission_id from public.role_permissions rp
       join public.roles r on r.id = rp.role_id
       where r.name = 'Tarifas del club' order by 1`,
    )
    expect(rows.map((row) => row.permission_id)).toEqual([
      'cuotas.editar',
      'cuotas.ver',
    ])
  })

  it('starts with the posted values, readable by visitors', async () => {
    const schedule = await run(
      null,
      'select valid_from::text, note from public.fee_schedules',
      [],
      'anon',
    )
    expect(schedule.rows).toEqual([{ valid_from: '2026-10-01', note: null }])
    const fees = await run(
      null,
      'select kind, name, price_cents from public.fees order by kind, position',
      [],
      'anon',
    )
    expect(fees.rows.filter((row) => row.kind === 'membership')).toHaveLength(9)
    expect(fees.rows.filter((row) => row.kind === 'service')).toHaveLength(6)
    const cadet = await run(
      null,
      "select icon, detail from public.fees where name = 'Cadete'",
      [],
      'anon',
    )
    expect(cadet.rows).toEqual([
      { icon: 'youth', detail: 'Menores de 16 años' },
    ])
    expect(fees.rows[0]).toEqual({
      kind: 'membership',
      name: 'Social',
      price_cents: 3000000,
    })
  })

  it('denies direct writes and requires the dedicated permissions', async () => {
    await expect(
      run(null, 'update public.fees set price_cents = 0', [], 'anon'),
    ).rejects.toThrow()
    await expect(
      run(editor, 'delete from public.fees returning id'),
    ).rejects.toThrow(/permission denied/)
    await expect(
      run(null, 'select public.admin_get_fees()', [], 'anon'),
    ).rejects.toThrow()
    await expect(current(other)).rejects.toThrow()
    await expect(current(viewer)).resolves.toMatchObject({
      fees: expect.any(Array),
    })
    await expect(save(viewer, (value) => value)).rejects.toThrow()
    await expect(
      run(root, 'select public.admin_save_role($1,$2)', [
        'Sin lectura',
        ['cuotas.editar'],
      ]),
    ).rejects.toThrow(/lectura/)
  })

  it('saves the schedule and both lists atomically, keeping ids', async () => {
    const before = await current()
    const social = before.fees.find((fee) => fee.name === 'Social')
    const camping = before.fees.find((fee) => fee.name === 'Carpa')
    const data = (
      await save(editor, () => ({
        valid_from: '2026-12-01',
        note: '  Se abonan del 1 al 10 de cada mes. ',
        fees: [
          camping,
          { ...social, price_cents: 3500000, detail: 'Mayores de 18 años' },
          {
            kind: 'service',
            name: 'Parrilla',
            icon: 'ticket',
            price_cents: 500000,
          },
        ],
      }))
    ).rows[0].data
    expect(data.valid_from).toBe('2026-12-01')
    expect(data.note).toBe('Se abonan del 1 al 10 de cada mes.')
    expect(data.fees.map((fee) => [fee.kind, fee.name])).toEqual([
      ['membership', 'Social'],
      ['service', 'Carpa'],
      ['service', 'Parrilla'],
    ])
    expect(data.fees[0]).toMatchObject({
      id: social.id,
      price_cents: 3500000,
      detail: 'Mayores de 18 años',
    })
    expect(data.fees[1].id).toBe(camping.id)
    const audit = await db.query(
      "select count(*)::int as n from public.audit_logs where action like 'fees.%'",
    )
    expect(audit.rows[0].n).toBeGreaterThan(0)
  })

  it('rejects stale versions and invalid values without partial changes', async () => {
    const schedule = await current()
    await expect(
      run(editor, 'select public.admin_save_fees($1,$2)', [
        schedule,
        '2000-01-01T00:00:00Z',
      ]),
    ).rejects.toThrow(/cambiaron/)
    await expect(
      save(editor, (value) => ({ ...value, fees: [] })),
    ).rejects.toThrow(/entre 1 y 40/)
    for (const bad of [
      { kind: 'other' },
      { price_cents: -1 },
      { name: ' ' },
      { icon: 'rocket' },
    ])
      await expect(
        save(editor, (value) => ({
          ...value,
          fees: [{ ...value.fees[0], ...bad }],
        })),
      ).rejects.toThrow()
    await expect(
      save(editor, (value) => ({ ...value, valid_from: '2026-12-15' })),
    ).rejects.toThrow()
    expect((await current()).fees).toHaveLength(3)
  })
})
