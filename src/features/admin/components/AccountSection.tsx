import { ArrowDown, KeyRound, Mail, UserRound } from 'lucide-react'
import { PasswordForm } from './PasswordForm'
import { EmailForm } from './EmailForm'
import { SessionSecurity } from './account/SessionSecurity'
import { SectionHeading } from './ui'
import { AccountRoles } from './account/AccountRoles'

export function AccountSection({
  email,
  roles = [],
}: {
  email: string
  roles?: readonly string[]
}) {
  return (
    <>
      <SectionHeading
        title="Mi cuenta"
        description="Administrá tu correo de acceso, contraseña y sesiones desde un mismo lugar."
      />
      <section
        aria-label="Cuenta actual"
        className="mb-6 flex min-w-0 flex-col gap-5 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-mist-50 text-navy-800"
          >
            <UserRound size={25} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold tracking-wider text-ink-600 uppercase">
              Cuenta administrativa
            </p>
            <p className="mt-1 text-base font-extrabold wrap-anywhere">
              {email}
            </p>
            <AccountRoles roles={roles} />
          </div>
        </div>
        <nav
          aria-label="Configuración de cuenta"
          className="flex flex-wrap gap-2"
        >
          {[
            ['#account-email', 'Correo'],
            ['#account-password', 'Contraseña'],
            ['#account-sessions', 'Sesión'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-mist-50 px-3 text-xs font-bold text-navy-900 hover:bg-navy-900/10"
            >
              {label}
              <ArrowDown size={13} aria-hidden="true" />
            </a>
          ))}
        </nav>
      </section>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="grid min-w-0 gap-6">
          <section
            id="account-email"
            aria-labelledby="account-email-title"
            className="min-w-0 scroll-mt-6 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
          >
            <header className="mb-6 flex items-start gap-3">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-mist-50 text-navy-800"
              >
                <Mail size={19} />
              </span>
              <div>
                <h2
                  id="account-email-title"
                  className="text-base font-extrabold"
                >
                  Cambiar correo de acceso
                </h2>
                <p className="mt-1 text-xs leading-5 text-ink-600">
                  Elegí otra dirección y completá la confirmación por correo.
                </p>
              </div>
            </header>
            <EmailForm key={email} currentEmail={email} />
          </section>
          <section
            id="account-password"
            aria-labelledby="account-password-title"
            className="min-w-0 scroll-mt-6 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
          >
            <header className="mb-6 flex items-start gap-3">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-mist-50 text-navy-800"
              >
                <KeyRound size={19} />
              </span>
              <div>
                <h2
                  id="account-password-title"
                  className="text-base font-extrabold"
                >
                  Cambiar contraseña
                </h2>
                <p className="mt-1 text-xs leading-5 text-ink-600">
                  Usá una contraseña propia de esta cuenta y verificá que
                  coincida al repetirla.
                </p>
              </div>
            </header>
            <PasswordForm />
          </section>
        </div>
        <aside className="min-w-0 xl:sticky xl:top-6">
          <SessionSecurity />
        </aside>
      </div>
    </>
  )
}
