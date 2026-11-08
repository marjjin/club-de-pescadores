// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
beforeAll(async () => {
  db = await createTestDatabase()
  await db.exec(`
    insert into public.events (title, starts_at, place, is_published, deleted_at) values
      ('Visible', now() + interval '1 day', 'Test', true, null),
      ('Draft', now(), 'Test', false, null),
      ('Deleted', now(), 'Test', true, now());
    insert into public.news (title, excerpt, image_url, image_alt, published_at, is_published, deleted_at) values
      ('Visible', 'Test', 'https://example.com/image.webp', 'Test', now() - interval '1 hour', true, null),
      ('Draft', 'Test', 'https://example.com/image.webp', 'Test', now(), false, null),
      ('Scheduled', 'Test', 'https://example.com/image.webp', 'Test', now() + interval '1 day', true, null),
      ('Deleted', 'Test', 'https://example.com/image.webp', 'Test', now(), true, now());
    insert into public.pool_rates (season, period, family_price_cents, individual_price_cents,
      family_description, valid_from, valid_until, is_published, deleted_at) values
      ('Test', 'Visible', 10000, 5000, 'Test', current_date, null, true, null),
      ('Test', 'Draft', 10000, 5000, 'Test', current_date, null, false, null),
      ('Test', 'Expired', 10000, 5000, 'Test', current_date - 2, current_date - 1, true, null),
      ('Test', 'Deleted', 10000, 5000, 'Test', current_date, null, true, now());
  `)
}, 30_000)
afterAll(async () => {
  await db?.close()
})

async function asRole(role, claims, sql) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(claims),
    ])
    return tx.query(sql)
  })
}

describe.each([
  ['anonymous', 'anon', {}],
  [
    'member',
    'authenticated',
    {
      sub: '10000000-0000-4000-8000-000000000001',
      app_metadata: { role: 'member' },
    },
  ],
  [
    'administrator',
    'authenticated',
    {
      sub: '10000000-0000-4000-8000-000000000002',
      app_metadata: { role: 'admin' },
    },
  ],
])('public content policies for %s', (_name, role, claims) => {
  it.each(['events', 'news', 'pool_rates'])(
    'exposes only published, active content in %s',
    async (table) => {
      const column = table === 'pool_rates' ? 'period' : 'title'
      const { rows } = await asRole(
        role,
        claims,
        `select ${column} as name from public.${table}`,
      )
      expect(rows).toEqual([{ name: 'Visible' }])
    },
  )

  it.each(['events', 'news', 'pool_rates'])(
    'denies every browser write on %s',
    async (table) => {
      for (const sql of [
        `insert into public.${table} default values`,
        `update public.${table} set is_published = true`,
        `delete from public.${table}`,
      ]) {
        await expect(asRole(role, claims, sql)).rejects.toMatchObject({
          code: '42501',
        })
      }
    },
  )
})

it('enables RLS and explicit operation policies on all exposed content tables', async () => {
  const { rows } = await db.query(
    "select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('events','news','pool_rates') order by tablename",
  )
  expect(rows).toEqual(
    ['events', 'news', 'pool_rates'].map((tablename) => ({
      tablename,
      rowsecurity: true,
    })),
  )
  const policies = await db.query(
    "select tablename, cmd from pg_policies where schemaname = 'public'",
  )
  for (const table of ['events', 'news', 'pool_rates']) {
    expect(
      policies.rows
        .filter((row) => row.tablename === table)
        .map((row) => row.cmd)
        .filter((cmd, index, commands) => commands.indexOf(cmd) === index)
        .sort(),
    ).toEqual(['DELETE', 'INSERT', 'SELECT', 'UPDATE'])
  }
})

it('keeps all content manageable through trusted service access', async () => {
  const { rows } = await asRole(
    'service_role',
    {},
    'select count(*)::int as count from public.news',
  )
  expect(rows[0].count).toBe(4)
  await asRole(
    'service_role',
    {},
    "update public.events set updated_at = '2000-01-01' where title = 'Draft'",
  )
  const result = await db.query(
    "select updated_at > '2000-01-01'::timestamptz as changed from public.events where title = 'Draft'",
  )
  expect(result.rows[0].changed).toBe(true)
})

it('enforces data constraints independently of browser validation', async () => {
  await expect(
    db.exec(
      "insert into public.events (title, starts_at, place) values ('', now(), 'Test')",
    ),
  ).rejects.toMatchObject({ code: '23514' })
  await expect(
    db.exec(
      "insert into public.news (title, excerpt, image_url, image_alt) values ('Test', 'Test', 'javascript:alert(1)', 'Test')",
    ),
  ).rejects.toMatchObject({ code: '23514' })
  await expect(
    db.exec(
      "insert into public.pool_rates (season, period, family_price_cents, individual_price_cents, family_description, valid_from) values ('Test', 'Test', -1, 1, 'Test', current_date)",
    ),
  ).rejects.toMatchObject({ code: '23514' })
})

it('paginates events with equal start times without skipping or duplicating rows', async () => {
  await db.exec(`insert into public.events (id, title, starts_at, place, is_published)
    select ('20000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Cursor test', '2030-01-01T11:00:00Z', 'Test', true
    from generate_series(1, 5) n`)
  const first = await db.query(
    "select id from public.events where title = 'Cursor test' order by starts_at, id limit 3",
  )
  const next = await db.query(
    "select id from public.events where title = 'Cursor test' and (starts_at > '2030-01-01T11:00:00Z' or (starts_at = '2030-01-01T11:00:00Z' and id > $1)) order by starts_at, id limit 3",
    [first.rows.at(-1).id],
  )
  expect(new Set([...first.rows, ...next.rows].map((row) => row.id)).size).toBe(
    5,
  )
  expect(next.rows).toHaveLength(2)
})
