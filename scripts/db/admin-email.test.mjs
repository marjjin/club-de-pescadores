// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const id = '10000000-0000-4000-8000-000000000080'
beforeAll(async () => {
  db = await createTestDatabase()
  // Auth's pending address is separate from its confirmed email.
  await db.exec('alter table auth.users add column email_change text')
  await db.query('insert into auth.users(id,email) values($1,$2)', [
    id,
    'original@example.test',
  ])
  await db.query('select public.bootstrap_admin($1)', ['original@example.test'])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

it('ignores pending email changes and synchronizes confirmed ones without changing permissions', async () => {
  const roles = (
    await db.query('select role_id from public.user_roles where user_id=$1', [
      id,
    ])
  ).rows
  await db.query('update auth.users set email_change=$1 where id=$2', [
    'new@example.test',
    id,
  ])
  expect(
    (
      await db.query('select email from public.admin_accounts where id=$1', [
        id,
      ])
    ).rows[0].email,
  ).toBe('original@example.test')
  await db.query(
    'update auth.users set email=$1, email_change=null where id=$2',
    ['new@example.test', id],
  )
  expect(
    (
      await db.query(
        'select id,email,active from public.admin_accounts where id=$1',
        [id],
      )
    ).rows[0],
  ).toEqual({ id, email: 'new@example.test', active: true })
  expect(
    (
      await db.query('select role_id from public.user_roles where user_id=$1', [
        id,
      ])
    ).rows,
  ).toEqual(roles)
  const logs = (
    await db.query(
      "select before_data,after_data from public.audit_logs where action='admin_accounts.update' and resource_id=$1",
      [id],
    )
  ).rows
  expect(logs).toHaveLength(1)
  expect(logs[0].before_data.email).toBe('original@example.test')
  expect(logs[0].after_data.email).toBe('new@example.test')
})
it('does not create administrative access for other Auth users', async () => {
  const other = '10000000-0000-4000-8000-000000000081'
  await db.query('insert into auth.users(id,email) values($1,$2)', [
    other,
    'other@example.test',
  ])
  await db.query('update auth.users set email=$1 where id=$2', [
    'changed@example.test',
    other,
  ])
  expect(
    (
      await db.query('select id from public.admin_accounts where id=$1', [
        other,
      ])
    ).rows,
  ).toHaveLength(0)
})
it('does not let browser accounts invoke the synchronization function directly', async () => {
  await expect(
    db.transaction(async (tx) => {
      await tx.exec('set local role authenticated')
      await tx.exec('select private.sync_admin_email()')
    }),
  ).rejects.toMatchObject({ code: '42501' })
})
