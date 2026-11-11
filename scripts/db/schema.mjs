import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const migrations = new URL('../../supabase/migrations/', import.meta.url)

export async function createTestDatabase() {
  const db = await PGlite.create()
  try {
    // Supabase creates these platform roles; the isolated test engine needs them.
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text);
      create function auth.jwt() returns jsonb language sql stable as
        'select coalesce(nullif(current_setting(''request.jwt.claims'', true), '''')::jsonb, ''{}''::jsonb)';
      create function auth.uid() returns uuid language sql stable as
        'select (auth.jwt()->>''sub'')::uuid';
      grant usage on schema auth to anon, authenticated, service_role;
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text, created_at timestamptz default now());
      alter table storage.objects enable row level security;
      grant usage on schema storage to anon, authenticated, service_role;
      grant select, insert, update, delete on storage.objects to authenticated;
    `)
    for (const name of (await readdir(migrations))
      .filter((name) => name.endsWith('.sql'))
      .sort()) {
      await db.exec(
        await readFile(fileURLToPath(new URL(name, migrations)), 'utf8'),
      )
    }
    return db
  } catch (error) {
    await db.close()
    throw error
  }
}
