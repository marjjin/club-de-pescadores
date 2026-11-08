// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

it('removes browser execution of the optional RLS helper and preserves automatic RLS', async () => {
  const db = await createTestDatabase()
  try {
    await db.exec(`
      create function public.rls_auto_enable() returns event_trigger
      language plpgsql security definer set search_path = '' as $$
      declare cmd record;
      begin
        for cmd in select object_identity from pg_event_trigger_ddl_commands() where object_type in ('table','partitioned table')
        loop execute 'alter table ' || cmd.object_identity || ' enable row level security'; end loop;
      end;
      $$;
      create event trigger rls_auto_enable_test on ddl_command_end when tag in ('CREATE TABLE')
        execute function public.rls_auto_enable();
    `)
    expect(
      (
        await db.query(
          "select has_function_privilege('anon','public.rls_auto_enable()','EXECUTE') as allowed",
        )
      ).rows[0].allowed,
    ).toBe(true)
    await db.exec(
      await readFile(
        new URL(
          '../../supabase/migrations/202611080008_rls_helper_permissions.sql',
          import.meta.url,
        ),
        'utf8',
      ),
    )
    for (const role of ['anon', 'authenticated']) {
      expect(
        (
          await db.query(
            "select has_function_privilege($1,'public.rls_auto_enable()','EXECUTE') as allowed",
            [role],
          )
        ).rows[0].allowed,
      ).toBe(false)
    }
    await db.exec('create table public.rls_probe(id uuid primary key)')
    expect(
      (
        await db.query(
          "select rowsecurity from pg_tables where schemaname='public' and tablename='rls_probe'",
        )
      ).rows[0].rowsecurity,
    ).toBe(true)
  } finally {
    await db.close()
  }
}, 30_000)
