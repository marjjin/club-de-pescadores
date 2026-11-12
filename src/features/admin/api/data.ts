import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { requestSignal } from '@/lib/supabase/request'
import type { Json } from '@/lib/supabase/database.types'
import { z } from '@/shared/lib/validation'
import {
  contentInputs,
  dashboardSchema,
  listSchemas,
  permissionSchema,
} from '../schemas/admin'
import type {
  ContentKind,
  ListKind,
  ListFilter,
  Role,
  Account,
} from '../schemas/admin'
import { adminError, parseAdminResponse } from './errors'
import { contentConfig } from '../content-fields'

export async function listAdmin<K extends ListKind>(
  kind: K,
  filter: ListFilter,
  signal: AbortSignal,
) {
  const { data, error } = await getAdminSupabase()
    .rpc('admin_list', {
      p_kind: kind,
      p_before: filter.cursor?.created_at ?? null,
      p_id: filter.cursor?.id ?? null,
      p_state: filter.state,
      p_search: filter.search,
    })
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(z.array(listSchemas[kind]), data)
}
export async function getDashboard(signal: AbortSignal) {
  const { data, error } = await getAdminSupabase()
    .rpc('admin_dashboard')
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(dashboardSchema, data)
}
export async function getPermissions(signal: AbortSignal) {
  const { data, error } = await getAdminSupabase()
    .rpc('admin_permissions')
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(z.array(permissionSchema), data)
}
export async function saveContent(
  kind: ContentKind,
  input: unknown,
  id: string | null,
  version: string | null,
) {
  const parsed = contentInputs[kind].safeParse(input)
  if (!parsed.success) {
    const field = contentConfig[kind].fields.find(
      (field) => field.name === parsed.error.issues[0]?.path[0],
    )
    throw new Error(
      field
        ? `Revisá el campo «${field.label}»: el valor no es válido o está fuera de los límites permitidos.`
        : 'Revisá los datos antes de guardar.',
    )
  }
  const { error } = await getAdminSupabase().rpc('admin_save_content', {
    p_kind: kind,
    p_data: parsed.data,
    p_id: id,
    p_version: version,
  })
  if (error) throw adminError(error)
}
export async function archiveContent(
  kind: ContentKind,
  id: string,
  version: string,
  restore: boolean,
) {
  const { error } = await getAdminSupabase().rpc('admin_archive_content', {
    p_kind: kind,
    p_id: id,
    p_version: version,
    p_restore: restore,
  })
  if (error) throw adminError(error)
}
export async function saveRole(
  name: string,
  permissions: string[],
  previous: Role | null,
) {
  const { error } = await getAdminSupabase().rpc('admin_save_role', {
    p_name: name,
    p_permissions: permissions,
    p_id: previous?.id ?? null,
    p_version: previous?.updated_at ?? null,
  })
  if (error) throw adminError(error)
}
export async function deleteRole(role: Role) {
  const { error } = await getAdminSupabase().rpc('admin_delete_role', {
    p_id: role.id,
    p_version: role.updated_at,
  })
  if (error) throw adminError(error)
}
async function manageUser(body: Record<string, Json>) {
  const response = await getAdminSupabase().functions.invoke<unknown>(
    'admin-users',
    { body },
  )
  const data: unknown = response.data
  const error: unknown = response.error
  if (error) {
    if (
      typeof error === 'object' &&
      'context' in error &&
      error.context instanceof Response
    ) {
      const responseBody: unknown = await error.context
        .clone()
        .json()
        .catch(() => null)
      const message = z
        .object({ error: z.string().min(1).max(300) })
        .safeParse(responseBody)
      if (message.success) throw new Error(message.data.error)
    }
    throw new Error(
      'No se pudo gestionar el usuario. Revisá sus datos y que la función de usuarios esté desplegada.',
    )
  }
  const parsed = z
    .object({ ok: z.literal(true), warning: z.string().optional() })
    .safeParse(data)
  if (!parsed.success) throw adminError(null)
  return parsed.data.warning ?? null
}
export function inviteUser(email: string, roles: string[]) {
  if (!z.email().safeParse(email).success)
    throw new Error('Ingresá un correo válido.')
  return manageUser({ action: 'invite', email, roles })
}
export function saveUser(account: Account, roles: string[], active: boolean) {
  return manageUser({
    action: 'update',
    id: account.id,
    roles,
    active,
    version: account.updated_at,
  })
}
/** Removes someone from the team: access and roles go, their history stays. */
export function removeUser(account: Account) {
  return manageUser({
    action: 'remove',
    id: account.id,
    version: account.updated_at,
  })
}
