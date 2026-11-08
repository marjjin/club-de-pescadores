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
