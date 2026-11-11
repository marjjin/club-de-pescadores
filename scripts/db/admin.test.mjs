// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000010'
const editor = '10000000-0000-4000-8000-000000000011'
const outsider = '10000000-0000-4000-8000-000000000012'
let systemRole
let editorRole

async function run(user, sql, args = [], aal = 'aal2', role = 'authenticated') {
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
beforeAll(async () => {
  db = await createTestDatabase()
  await db.query(
    'insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6)',
    [
      root,
      'root@example.test',
      editor,
      'editor@example.test',
      outsider,
      'outside@example.test',
    ],
  )
  await db.query('select public.bootstrap_admin($1)', ['root@example.test'])
  systemRole = (await db.query('select id from public.roles where is_system'))
    .rows[0].id
  editorRole = (
    await run(root, 'select public.admin_save_role($1,$2) as id', [
      'Editor',
      ['noticias.ver', 'noticias.editar'],
    ])
  ).rows[0].id
  await run(root, 'select public.admin_save_user($1,$2,true)', [
    editor,
    [editorRole],
  ])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

it('rejects claims-based privilege escalation and requires a live active role plus MFA', async () => {
  for (const [user, aal] of [
    [outsider, 'aal2'],
    [root, 'aal1'],
  ]) {
    const result = await run(
      user,
      "select public.has_permission('roles.gestionar') as allowed",
      [],
      aal,
    )
    expect(result.rows[0].allowed).toBe(false)
    await expect(
      run(user, 'select public.admin_dashboard()', [], aal),
    ).rejects.toMatchObject({ code: '42501' })
  }
  await expect(
    run(null, 'select public.admin_context()', [], 'aal1', 'anon'),
  ).rejects.toMatchObject({ code: '42501' })
  expect(
    (await run(root, 'select public.admin_context() as context')).rows[0]
      .context,
  ).toEqual({ active: true, general: true, aal2: true })
})

it('denies direct writes, bootstrap access and reserved role assignment to browser accounts', async () => {
  for (const sql of [
    "insert into public.roles(name) values ('Unauthorized')",
    'delete from public.audit_logs',
    "select public.bootstrap_admin('outside@example.test')",
    'update public.admin_accounts set active=true',
  ])
    await expect(run(root, sql)).rejects.toMatchObject({ code: '42501' })
  await expect(
    run(
      editor,
      "select public.admin_save_role('Escalation', array['roles.gestionar'])",
    ),
  ).rejects.toMatchObject({ code: '42501' })
  await expect(
    run(
      root,
      "select public.admin_save_role('Reserved', array['usuarios.gestionar'])",
    ),
  ).rejects.toMatchObject({ code: '42501' })
  await expect(
    run(
      root,
      "select public.admin_save_role('Missing read', array['noticias.editar'])",
    ),
  ).rejects.toMatchObject({ code: '22023' })
})

it('creates, updates and lists roles without granting ownership of the protected role', async () => {
  const id = (
    await run(
      root,
      "select public.admin_save_role('Archivista', array['noticias.ver','noticias.archivar']) as id",
    )
  ).rows[0].id
  const version = (
    await db.query('select updated_at from public.roles where id=$1', [id])
  ).rows[0].updated_at
  await run(
    root,
    "select public.admin_save_role('Archivista actualizado', array['noticias.ver'], $1, $2)",
    [id, version],
  )
  const list = (await run(root, "select public.admin_list('roles') as items"))
    .rows[0].items
  expect(list.find((item) => item.id === id)).toMatchObject({
    name: 'Archivista actualizado',
    permissions: ['noticias.ver'],
  })
  await expect(
    run(
      root,
      "select public.admin_save_role('Root renamed', array[]::text[], $1, now())",
      [systemRole],
    ),
  ).rejects.toMatchObject({ code: '42501' })
  await expect(
    run(root, 'select public.admin_delete_role($1,now())', [systemRole]),
  ).rejects.toMatchObject({ code: '23503' })
})

const article = {
  title: 'Prueba administrativa',
  excerpt: 'Contenido de prueba aislado.',
  image_url: 'https://example.test/image.webp',
  image_alt: 'Prueba',
  published_at: '2026-01-01T00:00:00Z',
  is_published: false,
}
it('stores the cover framing, keeps it when omitted and rejects values outside 0-100', async () => {
  const created = (
    await run(editor, "select public.admin_save_content('news',$1) as item", [
      article,
    ])
  ).rows[0].item
  expect(created).toMatchObject({ image_focus_x: 50, image_focus_y: 50 })
  const framed = (
    await run(
      editor,
      "select public.admin_save_content('news',$1,$2,$3) as item",
      [
        { ...article, image_focus_x: 20, image_focus_y: 85 },
        created.id,
        created.updated_at,
      ],
    )
  ).rows[0].item
  expect(framed).toMatchObject({ image_focus_x: 20, image_focus_y: 85 })
  // Clients deployed before this column existed must not reset the framing.
  const kept = (
    await run(
      editor,
      "select public.admin_save_content('news',$1,$2,$3) as item",
      [{ ...article, title: 'Sin encuadre' }, framed.id, framed.updated_at],
    )
  ).rows[0].item
  expect(kept).toMatchObject({ image_focus_x: 20, image_focus_y: 85 })
  for (const focus of [-1, 101])
    await expect(
      run(editor, "select public.admin_save_content('news',$1,$2,$3)", [
        { ...article, image_focus_x: focus },
        kept.id,
        kept.updated_at,
      ]),
    ).rejects.toMatchObject({ code: '23514' })
  const listed = (
    await run(editor, "select public.admin_list('news') as items")
  ).rows[0].items.find((item) => item.id === kept.id)
  expect(listed).toMatchObject({ image_focus_x: 20, image_focus_y: 85 })
})
it('lets editors save drafts but denies publication, including changes to already-published rows', async () => {
  const draft = (
    await run(editor, "select public.admin_save_content('news',$1) as item", [
      article,
    ])
  ).rows[0].item
  await expect(
    run(editor, "select public.admin_save_content('news',$1)", [
      { ...article, is_published: true },
    ]),
  ).rejects.toMatchObject({ code: '42501' })
  const published = (
    await run(
      root,
      "select public.admin_save_content('news',$1,$2,$3) as item",
      [{ ...article, is_published: true }, draft.id, draft.updated_at],
    )
  ).rows[0].item
  await expect(
    run(editor, "select public.admin_save_content('news',$1,$2,$3)", [
      { ...article, title: 'Bypass' },
      published.id,
      published.updated_at,
    ]),
  ).rejects.toMatchObject({ code: '42501' })
  await expect(
    run(root, "select public.admin_save_content('news',$1,$2,$3)", [
      article,
      published.id,
      draft.updated_at,
    ]),
  ).rejects.toMatchObject({ code: '40001' })
  await run(root, "select public.admin_archive_content('news',$1,$2,false)", [
    published.id,
    published.updated_at,
  ])
  const archived = (
    await db.query(
      'select updated_at,deleted_at from public.news where id=$1',
      [published.id],
    )
  ).rows[0]
  expect(archived.deleted_at).toBeTruthy()
  await run(root, "select public.admin_archive_content('news',$1,$2,true)", [
    published.id,
    archived.updated_at,
  ])
  expect(
    (
      await db.query(
        'select is_published,deleted_at from public.news where id=$1',
        [published.id],
      )
    ).rows[0],
  ).toEqual({ is_published: false, deleted_at: null })
  const audit = (
    await db.query(
      "select actor_id,after_data from public.audit_logs where action='news.update' and resource_id=$1 order by created_at desc limit 1",
      [published.id],
    )
  ).rows[0]
  expect(audit.actor_id).toBe(root)
  expect(audit.after_data.is_published).toBe(false)
})

it('creates and validates events and rates on the server', async () => {
  const event = {
    title: 'Evento de prueba',
    starts_at: '2030-01-01T18:00:00Z',
    place: 'Prueba',
    is_published: true,
  }
  const created = (
    await run(root, "select public.admin_save_content('events',$1) as item", [
      event,
    ])
  ).rows[0].item
  expect(created.place).toBe('Prueba')
  const rate = {
    season: 'Temporada prueba',
    period: 'Día',
    family_price_cents: 125050,
    individual_price_cents: 10000,
    family_description: 'Prueba',
    valid_from: '2030-01-01',
    valid_until: '2030-02-01',
    is_published: false,
  }
  expect(
    (
      await run(
        root,
        "select public.admin_save_content('pool_rates',$1) as item",
        [rate],
      )
    ).rows[0].item.family_price_cents,
  ).toBe(125050)
  await expect(
    run(root, "select public.admin_save_content('pool_rates',$1)", [
      { ...rate, family_price_cents: -1 },
    ]),
  ).rejects.toMatchObject({ code: '23514' })
  await expect(
    run(root, "select public.admin_save_content('audit_logs','{}')"),
  ).rejects.toMatchObject({ code: '22023' })
})

it('keeps the last general administrator and rejects self-access changes', async () => {
  await expect(
    run(root, 'select public.admin_save_user($1,$2,false,now())', [
      root,
      [editorRole],
    ]),
  ).rejects.toMatchObject({ code: '42501' })
  await expect(
    run(editor, 'select public.admin_save_user($1,$2,false,now())', [
      root,
      [editorRole],
    ]),
  ).rejects.toMatchObject({ code: '42501' })
  expect(
    (
      await db.query('select active from public.admin_accounts where id=$1', [
        root,
      ])
    ).rows[0].active,
  ).toBe(true)
})

it('revokes database access immediately with an already-issued JWT after deactivation', async () => {
  const version = (
    await db.query('select updated_at from public.admin_accounts where id=$1', [
      editor,
    ])
  ).rows[0].updated_at
  await run(root, 'select public.admin_save_user($1,$2,false,$3)', [
    editor,
    [editorRole],
    version,
  ])
  await expect(
    run(editor, "select public.admin_list('news')"),
  ).rejects.toMatchObject({ code: '42501' })
  expect(
    (await run(editor, 'select public.admin_context() as context')).rows[0]
      .context.active,
  ).toBe(false)
})

it('paginates with a stable cursor and applies full-text filtering in SQL', async () => {
  await db.exec(
    `insert into public.events(title,starts_at,place) select 'Cursor administrativo ' || n, now(), 'Prueba' from generate_series(1,45) n`,
  )
  const first = (
    await run(
      root,
      "select public.admin_list('events',null,null,'draft','administrativo') as items",
    )
  ).rows[0].items
  expect(first).toHaveLength(21)
  const last = first[19]
  const second = (
    await run(
      root,
      "select public.admin_list('events',$1,$2,'draft','administrativo') as items",
      [last.created_at, last.id],
    )
  ).rows[0].items
  expect(second).toHaveLength(21)
  expect(
    new Set(
      [...first.slice(0, 20), ...second.slice(0, 20)].map((row) => row.id),
    ).size,
  ).toBe(40)
})

it('validates invitation roles and finds interrupted Auth invitations without granting access', async () => {
  const target = (
    await run(root, 'select public.admin_invitation_target($1,$2) as target', [
      'outside@example.test',
      [editorRole],
    ])
  ).rows[0].target
  expect(target).toEqual({ existing_id: outsider, registered: false })
  const existing = (
    await run(root, 'select public.admin_invitation_target($1,$2) as target', [
      'root@example.test',
      [editorRole],
    ])
  ).rows[0].target
  expect(existing.registered).toBe(true)
  await expect(
    run(root, 'select public.admin_invitation_target($1,$2)', [
      'outside@example.test',
      [outsider],
    ]),
  ).rejects.toMatchObject({ code: '22023' })
  await expect(
    run(outsider, 'select public.admin_invitation_target($1,$2)', [
      'root@example.test',
      [systemRole],
    ]),
  ).rejects.toMatchObject({ code: '42501' })
  const audit = (
    await run(
      root,
      "select public.admin_list('audit',null,null,'all','admin_accounts.') as items",
    )
  ).rows[0].items
  expect(audit.some((entry) => entry.actor_email === 'root@example.test')).toBe(
    true,
  )
})

it('uses the cursor and full-text indexes on representative administrative data', async () => {
  await db.exec(`insert into public.events(title,starts_at,place)
    select case when n % 20 = 0 then 'Torneo especial' else 'Actividad de prueba' end,
      now() + interval '1 hour' * n, 'Prueba' from generate_series(1,2000) n;
    analyze public.events;`)
  const cursorPlan =
    await db.query(`explain (analyze, format json) select id,title,created_at from public.events
    where deleted_at is null order by created_at desc,id desc limit 21`)
  expect(JSON.stringify(cursorPlan.rows)).toContain('events_admin_cursor')
  const searchPlan =
    await db.query(`explain (analyze, format json) select id,title from public.events
    where to_tsvector('spanish',title) @@ websearch_to_tsquery('spanish','especial')`)
  expect(JSON.stringify(searchPlan.rows)).toContain('events_admin_search')
})

it('rate-limits invitations per verified administrator', async () => {
  const protection = await db.query(
    "select rowsecurity from pg_tables where schemaname='private' and tablename='invitation_limits'",
  )
  expect(protection.rows[0].rowsecurity).toBe(true)
  await expect(
    run(root, 'update private.invitation_limits set attempts=0'),
  ).rejects.toMatchObject({ code: '42501' })
  for (let i = 0; i < 10; i++)
    expect(
      (await run(root, 'select public.admin_allow_invitation() as allowed'))
        .rows[0].allowed,
    ).toBe(true)
  expect(
    (await run(root, 'select public.admin_allow_invitation() as allowed'))
      .rows[0].allowed,
  ).toBe(false)
})

it('restricts Storage uploads to an authorized user folder and blocks overwrites', async () => {
  const path = `${root}/20000000-0000-4000-8000-000000000001.webp`
  await run(
    root,
    "insert into storage.objects(bucket_id,name) values ('news-images',$1)",
    [path],
  )
  await expect(
    run(
      outsider,
      "insert into storage.objects(bucket_id,name) values ('news-images',$1)",
      [path],
    ),
  ).rejects.toMatchObject({ code: '42501' })
  await expect(
    run(
      root,
      "insert into storage.objects(bucket_id,name) values ('news-images',$1)",
      [`${outsider}/20000000-0000-4000-8000-000000000001.webp`],
    ),
  ).rejects.toMatchObject({ code: '42501' })
  await expect(
    run(
      root,
      "insert into storage.objects(bucket_id,name) values ('news-images',$1)",
      [`${root}/20000000-0000-4000-8000-000000000001.svg`],
    ),
  ).rejects.toMatchObject({ code: '42501' })
  expect(
    (
      await run(
        root,
        "update storage.objects set name='overwrite' returning id",
      )
    ).rows,
  ).toHaveLength(0)
})

it('all administrative tables have RLS and no writable browser grants', async () => {
  const tables = [
    'roles',
    'permissions',
    'role_permissions',
    'admin_accounts',
    'user_roles',
    'audit_logs',
  ]
  for (const table of tables) {
    const result = await db.query(
      "select rowsecurity from pg_tables where schemaname='public' and tablename=$1",
      [table],
    )
    expect(result.rows[0].rowsecurity).toBe(true)
    for (const privilege of ['INSERT', 'UPDATE', 'DELETE'])
      expect(
        (
          await db.query('select has_table_privilege($1,$2,$3) as allowed', [
            'authenticated',
            `public.${table}`,
            privilege,
          ])
        ).rows[0].allowed,
      ).toBe(false)
  }
})
