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
    jsonb: 'Json',
  }
  const functionRows = await db.query(`
    select p.proname, p.proargnames, p.pronargdefaults,
      array(select format_type(t, null) from unnest(p.proargtypes::oid[]) t) as args,
      format_type(p.prorettype, null) as result
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prorettype <> 'trigger'::regtype
    order by p.proname
  `)
  const rpcType = (name) => {
    if (name.endsWith('[]')) return `(${rpcType(name.slice(0, -2))})[]`
    if (name === 'void') return 'undefined'
    if (!types[name]) throw new Error(`Unsupported RPC type: ${name}`)
    return types[name]
  }
  const functions = functionRows.rows.map((row) => {
    const args = row.args.map(
      (type, i) =>
        `${row.proargnames[i]}${i >= row.args.length - row.pronargdefaults ? '?' : ''}: ${rpcType(type)} | null`,
    )
    return `${row.proname}: { Args: ${args.length ? `{ ${args.join(';')} }` : 'Record<never, never>'}; Returns: ${rpcType(row.result)} }`
  })
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
    export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
    export type Database = {
      public: {
        Tables: { ${definitions.join('\n')} }
        Views: Record<never, never>
        Functions: { ${functions.join('\n')} }
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
