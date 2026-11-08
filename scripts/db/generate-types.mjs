import { readFile, writeFile } from 'node:fs/promises'
import { format } from 'prettier'
import { createTestDatabase } from './schema.mjs'

const db = await createTestDatabase()
try {
  const { rows } = await db.query(`
    select table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `)
  const groups = Map.groupBy(rows, (row) => row.table_name)
  const types = {
    uuid: 'string',
    text: 'string',
    date: 'string',
    'timestamp with time zone': 'string',
    integer: 'number',
    boolean: 'boolean',
  }
  const definitions = [...groups].map(([table, columns]) => {
    const fields = (mode) =>
      columns
        .map((column) => {
          const type = types[column.data_type]
          if (!type)
            throw new Error(`Unsupported database type: ${column.data_type}`)
          const nullable = column.is_nullable === 'YES'
          const optional =
            mode === 'Update' ||
            (mode === 'Insert' && (nullable || column.column_default !== null))
          return `${column.column_name}${optional ? '?' : ''}: ${type}${nullable ? ' | null' : ''}`
        })
        .join('\n')
    return `${table}: { Row: {${fields('Row')}}; Insert: {${fields('Insert')}}; Update: {${fields('Update')}}; Relationships: [] }`
  })
  const source = await format(
    `
    // Generated from the applied local PostgreSQL migrations. Do not edit manually.
    // Regenerate: npm run db:types. Compare with Supabase-generated types after remote migration.
    export type Database = {
      public: {
        Tables: { ${definitions.join('\n')} }
        Views: Record<never, never>
        Functions: Record<never, never>
        Enums: Record<never, never>
        CompositeTypes: Record<never, never>
      }
    }
  `,
    { parser: 'typescript', semi: false, singleQuote: true },
  )
  const destination = new URL(
    '../../src/lib/supabase/database.types.ts',
    import.meta.url,
  )
  if (process.argv.includes('--check')) {
    if ((await readFile(destination, 'utf8')) !== source) {
      throw new Error(
        'Database types differ from migrations. Run npm run db:types.',
      )
    }
    console.log('Database types match the applied migrations.')
  } else {
    await writeFile(destination, source)
    console.log('Generated database types from the applied migrations.')
  }
} finally {
  await db.close()
}
