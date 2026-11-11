import { createContext, useContext } from 'react'

export type Access = { general: boolean; permissions: readonly string[] }

/**
 * What the signed-in person may open. This only shapes the interface; every action
 * is still authorized by the database (RLS and permission-checked RPCs).
 */
export const AccessContext = createContext<Access>({
  // Isolated renders (component tests) see the full panel, like a general admin.
  general: true,
  permissions: [],
})

export function useAccess() {
  const access = useContext(AccessContext)
  return {
    ...access,
    can: (permission: string) =>
      access.general || access.permissions.includes(permission),
  }
}

/** Sections of the panel and the permission that opens each one. */
export const sectionPermissions = {
  noticias: 'noticias.ver',
  eventos: 'eventos.ver',
  tarifas: 'tarifas.ver',
  muelle: 'muelle.publicar',
  usuarios: 'usuarios.ver',
  roles: 'roles.gestionar',
  actividad: 'auditoria.ver',
} as const
