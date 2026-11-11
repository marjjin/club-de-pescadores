import { useId } from 'react'
import type { ReactNode } from 'react'
import { Link, Route, Routes } from 'react-router'
import { LogOut, Menu } from 'lucide-react'
import { useAuthActions } from '../hooks/useAdminActions'
import { useAdminMobileMenu } from '../hooks/useAdminMobileMenu'
import { AdminNavigation } from './AdminNavigation'
import { AdminMobileMenu } from './AdminMobileMenu'
import { Dashboard } from './Dashboard'
import { ContentSection } from './ContentSection'
import { RolesSection } from './RolesSection'
import { UsersSection } from './UsersSection'
import { AuditSection } from './AuditSection'
import { AccountSection } from './AccountSection'
import { PierSection } from './pier/PierSection'
import { NewNewsRoute } from './news-editor/NewNewsRoute'
import { Feedback, SectionHeading } from './ui'
import { sectionPermissions, useAccess } from '../hooks/useAccess'

export function AdminWorkspace({
  userId,
  email,
}: {
  userId: string
  email: string
}) {
  const { logout } = useAuthActions()
  const { open, triggerRef, dialogRef, show, close, onClosed } =
    useAdminMobileMenu()
  const menuId = useId()
  const { can, general } = useAccess()
  // Hidden links are not enough: a typed URL to a section without permission shows this.
  const gate = (permission: string, element: ReactNode) =>
    can(permission) ? (
      element
    ) : (
      <SectionHeading
        title="Sin acceso a esta sección"
        description="Tu rol no incluye esta sección. Pedile a un administrador que te asigne el permiso si lo necesitás."
      />
    )
  return (
    <div className="min-h-dvh bg-mist-50 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-sun-400 focus:p-3"
      >
        Saltar al contenido
      </a>
      <aside className="hidden bg-navy-950 text-white lg:sticky lg:top-0 lg:block lg:h-dvh">
        <AdminNavigation />
      </aside>
      <AdminMobileMenu
        id={menuId}
        dialogRef={dialogRef}
        onDismiss={() => close()}
        onNavigate={() => close('content')}
        onClosed={onClosed}
      />
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-w-0 items-center gap-3 border-b border-navy-900/10 bg-white px-4 py-3 sm:px-6 lg:static lg:px-9 lg:py-4">
          <button
            ref={triggerRef}
            type="button"
            aria-label="Abrir menú de administración"
            aria-expanded={open}
            aria-controls={menuId}
            aria-haspopup="dialog"
            onClick={show}
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-navy-900/15 text-navy-900 hover:bg-mist-50 lg:hidden"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-wider text-ink-600 uppercase sm:text-xs">
              {general ? 'Administrador general' : 'Equipo del club'}
            </p>
            <p className="mt-1 truncate text-xs font-semibold sm:text-sm">
              {email}
            </p>
          </div>
          <button
            onClick={() => logout.mutate(false)}
            disabled={logout.isPending}
            type="button"
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold text-ink-600 hover:bg-mist-50"
          >
            <LogOut size={17} aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Cerrar sesión</span>
          </button>
        </header>
        <main
          id="admin-content"
          tabIndex={-1}
          className="mx-auto w-full min-w-0 max-w-7xl p-5 sm:p-7 lg:p-9"
        >
          <Feedback error={logout.error} />
          <Routes>
            <Route index element={<Dashboard userId={userId} />} />
            <Route
              path="noticias/nueva"
              element={gate('noticias.editar', <NewNewsRoute />)}
            />
            <Route
              path="noticias"
              element={gate(
                sectionPermissions.noticias,
                <ContentSection key="news" kind="news" userId={userId} />,
              )}
            />
            <Route
              path="eventos"
              element={gate(
                sectionPermissions.eventos,
                <ContentSection key="events" kind="events" userId={userId} />,
              )}
            />
            <Route
              path="tarifas"
              element={gate(
                sectionPermissions.tarifas,
                <ContentSection
                  key="rates"
                  kind="pool_rates"
                  userId={userId}
                />,
              )}
            />
            <Route
              path="usuarios"
              element={gate(
                sectionPermissions.usuarios,
                <UsersSection userId={userId} />,
              )}
            />
            <Route
              path="muelle"
              element={gate(
                sectionPermissions.muelle,
                <PierSection userId={userId} />,
              )}
            />
            <Route
              path="roles"
              element={gate(
                sectionPermissions.roles,
                <RolesSection userId={userId} />,
              )}
            />
            <Route
              path="actividad"
              element={gate(
                sectionPermissions.actividad,
                <AuditSection userId={userId} />,
              )}
            />
            <Route path="cuenta" element={<AccountSection email={email} />} />
            <Route
              path="*"
              element={
                <>
                  <SectionHeading
                    title="Sección no encontrada"
                    description="La dirección no corresponde a una sección del panel."
                  />
                  <Link to="/admin" className="font-bold text-river-600">
                    Volver al resumen
                  </Link>
                </>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}
