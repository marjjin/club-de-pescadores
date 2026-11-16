// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase } from './schema.mjs'

let db
const root = '10000000-0000-4000-8000-000000000040'
const editor = '10000000-0000-4000-8000-000000000041'
const viewer = '10000000-0000-4000-8000-000000000042'
const other = '10000000-0000-4000-8000-000000000043'
const photo = (n, owner = editor) =>
  `${owner}/2000000${n}-0000-4000-8000-000000000000.webp`

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
  (await run(user, 'select public.admin_get_facilities() as data')).rows[0].data
const save = async (user, change) => {
  const section = await current(root)
  return run(user, 'select public.admin_save_facilities($1,$2) as data', [
    change(section),
    section.updated_at,
  ])
}
const upload = (name, owner = editor, age = '0 hours') =>
  db.query(
    `insert into storage.objects(bucket_id,name,owner_id,created_at)
     values ('club-media',$1,$2,now() - $3::interval)`,
    [name, owner, age],
  )

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
  const role = async (name, permissions) =>
    (
      await run(root, 'select public.admin_save_role($1,$2) as id', [
        name,
        permissions,
      ])
    ).rows[0].id
  const editing = await role('Instalaciones', [
    'instalaciones.ver',
    'instalaciones.editar',
  ])
  const reading = await role('Consulta de instalaciones', ['instalaciones.ver'])
  const news = await role('Noticias', ['noticias.ver', 'noticias.editar'])
  for (const [id, roleId] of [
    [editor, editing],
    [viewer, reading],
    [other, news],
  ])
    await run(root, 'select public.admin_save_user($1,$2,true)', [id, [roleId]])
}, 30_000)
afterAll(async () => {
  await db?.close()
})

describe('editable facilities section', () => {
  it('starts with the original heading and cards, readable by visitors', async () => {
    const section = await run(
      null,
      'select title, description from public.facility_sections',
      [],
      'anon',
    )
    expect(section.rows).toEqual([
      {
        title: 'Un espacio pensado para los socios',
        description:
          'Todo lo que necesitás para disfrutar del río, en familia o con amigos.',
      },
    ])
    const cards = await run(
      null,
      'select name, default_image, image_path from public.facilities order by position',
      [],
      'anon',
    )
    expect(cards.rows.map((row) => row.name)).toEqual([
      'Muelle',
      'Quincho',
      'Parrillas',
      'Entorno natural',
    ])
    expect(cards.rows.every((row) => row.image_path === null)).toBe(true)
  })

  it('denies direct writes and requires the dedicated permissions', async () => {
    await expect(
      run(null, "update public.facility_sections set title = 'x'", [], 'anon'),
    ).rejects.toThrow()
    await expect(
      run(editor, 'delete from public.facilities returning id'),
    ).rejects.toThrow(/permission denied/)
    await expect(current(other)).rejects.toThrow()
    await expect(current(viewer)).resolves.toMatchObject({
      cards: expect.any(Array),
    })
    await expect(save(viewer, (section) => section)).rejects.toThrow()
    await expect(
      run(root, 'select public.admin_save_role($1,$2)', [
        'Sin lectura',
        ['instalaciones.editar'],
      ]),
    ).rejects.toThrow(/lectura/)
  })

  it('saves the heading, reorders, adds and removes cards atomically', async () => {
    const before = await current()
    const [pier, hall, grill] = before.cards
    await upload(photo(1))
    const data = (
      await save(editor, () => ({
        title: '  Nuestras instalaciones ',
        description: 'Todo junto al río.',
        cards: [
          { ...grill, description: 'Parrillas techadas.' },
          pier,
          {
            name: 'Pileta',
            description: 'Para el verano.',
            image_path: photo(1),
            image_alt: 'Pileta del club',
          },
        ],
      }))
    ).rows[0].data
    expect(data.title).toBe('Nuestras instalaciones')
    expect(data.cards.map((card) => card.name)).toEqual([
      'Parrillas',
      'Muelle',
      'Pileta',
    ])
    expect(data.cards[0]).toMatchObject({
      id: grill.id,
      description: 'Parrillas techadas.',
      default_image: 'grill',
    })
    expect(data.cards[2]).toMatchObject({
      image_path: photo(1),
      default_image: null,
    })
    expect(data.cards.map((card) => card.id)).not.toContain(hall.id)
    const audit = await db.query(
      "select count(*)::int as n from public.audit_logs where action like 'facilit%'",
    )
    expect(audit.rows[0].n).toBeGreaterThan(0)
  })

  it('rejects stale versions, invalid card lists and photos the caller did not upload', async () => {
    const section = await current()
    await expect(
      run(editor, 'select public.admin_save_facilities($1,$2)', [
        section,
        '2000-01-01T00:00:00Z',
      ]),
    ).rejects.toThrow(/cambió/)
    await expect(
      save(editor, (value) => ({ ...value, cards: [] })),
    ).rejects.toThrow(/entre 1 y 8/)
    await expect(
      save(editor, (value) => ({
        ...value,
        cards: Array.from({ length: 9 }, () => value.cards[0]),
      })),
    ).rejects.toThrow(/entre 1 y 8/)
    await upload(photo(2, root), root)
    await expect(
      save(editor, (value) => ({
        ...value,
        cards: [{ ...value.cards[0], image_path: photo(2, root) }],
      })),
    ).rejects.toThrow(/Foto no disponible/)
    await expect(
      save(editor, (value) => ({
        ...value,
        cards: [{ ...value.cards[0], name: ' ' }],
      })),
    ).rejects.toThrow()
    expect((await current()).cards).toHaveLength(3)
  })

  it('keeps photos in use out of the media cleanup and protects them from deletion', async () => {
    await db.query(
      "update storage.objects set created_at = now() - interval '2 days' where name = $1",
      [photo(1)],
    )
    await upload(photo(3), editor, '2 days')
    const pruned = (
      await run(editor, 'select public.admin_prune_club_media() as names')
    ).rows[0].names
    expect(pruned).toContain(photo(3))
    expect(pruned).not.toContain(photo(1))
    expect(
      (
        await run(editor, 'select public.club_media_in_use($1) as used', [
          photo(1),
        ])
      ).rows[0].used,
    ).toBe(true)
    // The card already shows the photo, so saving it again needs no new upload.
    await expect(save(editor, (value) => value)).resolves.toBeTruthy()
  })
})
