import { LockKeyhole, ShieldCheck } from 'lucide-react'
import type { UserAccessValues } from '../../user-access'

export function UserAccessSummary({
  values,
  editing,
}: {
  values: UserAccessValues
  editing: boolean
}) {
  return (
    <aside className="grid min-w-0 gap-5 xl:sticky xl:top-6">
      <section className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold">
          {editing ? 'Resumen del acceso' : 'Resumen de la invitación'}
        </h2>
        <dl className="grid gap-4 text-sm">
          <div>
            <dt className="text-xs text-ink-600">Cuenta</dt>
            <dd className="mt-1 font-bold wrap-anywhere">
              {values.email.trim() || 'Correo por completar'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-600">Roles seleccionados</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums">
              {values.roles.length}
              <span className="ml-1 text-xs font-normal text-ink-600">
                de un máximo de 10
              </span>
            </dd>
          </div>
          {editing && (
            <div>
              <dt className="text-xs text-ink-600">Estado al guardar</dt>
              <dd
                className={`mt-1 font-bold ${values.active ? 'text-emerald-800' : 'text-amber-900'}`}
              >
                {values.active ? 'Activo' : 'Desactivado'}
              </dd>
            </div>
          )}
        </dl>
      </section>
      <section className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <ShieldCheck size={17} aria-hidden="true" />
          Alcance de los roles
        </h2>
        <p className="mt-3 text-xs leading-5 text-ink-600">
          El rol Administrador general otorga control completo del club.
          Asignalo a quienes deban administrar contenido y accesos.
        </p>
        <p className="mt-3 text-xs leading-5 text-ink-600">
          Cada persona ve en el panel solo las secciones que incluyen sus roles.
          Solo podés asignar roles con permisos que vos ya tenés.
        </p>
      </section>
      {!editing && (
        <section className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <LockKeyhole size={17} aria-hidden="true" />
            Después de invitar
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-5 text-ink-600">
            <li>La persona recibe un enlace por correo.</li>
            <li>Define su propia contraseña.</li>
            <li>Configura el autenticador para verificar su acceso.</li>
          </ol>
        </section>
      )}
    </aside>
  )
}
