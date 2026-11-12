/** The roles the signed-in person holds, as the database reports them. */
export function AccountRoles({ roles }: { roles: readonly string[] }) {
  if (!roles.length)
    return (
      <p className="mt-2 text-xs text-ink-600">
        Todavía no tenés roles asignados.
      </p>
    )
  return (
    <div className="mt-2">
      <ul aria-label="Tus roles" className="flex flex-wrap gap-1.5">
        {roles.map((role) => (
          <li
            key={role}
            className="rounded-full bg-river-600/10 px-2.5 py-1 text-xs font-bold text-navy-900"
          >
            {role}
          </li>
        ))}
      </ul>
    </div>
  )
}
