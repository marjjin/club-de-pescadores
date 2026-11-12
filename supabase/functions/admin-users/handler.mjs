const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function createUserHandler(config, request = fetch) {
  return async (req) => {
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      Vary: 'Origin',
    }
    const origin = req.headers.get('origin')
    if (origin === config.siteUrl) {
      headers['Access-Control-Allow-Origin'] = config.siteUrl
      headers['Access-Control-Allow-Headers'] =
        'authorization, apikey, content-type, x-client-info'
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    } else if (origin)
      return new Response(JSON.stringify({ error: 'Origen no permitido.' }), {
        status: 403,
        headers,
      })
    const reply = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers })
    if (req.method === 'OPTIONS')
      return new Response(null, { status: 204, headers })
    if (req.method !== 'POST')
      return reply({ error: 'Método no permitido.' }, 405)
    if (
      !config.url ||
      !config.publicKey ||
      !config.serviceKey ||
      !config.siteUrl
    )
      return reply({ error: 'Servicio no configurado.' }, 503)
    const authorization = req.headers.get('authorization') ?? ''
    if (!/^Bearer \S+$/i.test(authorization))
      return reply({ error: 'Sesión requerida.' }, 401)
    const call = async (path, body, privileged = false, method = 'POST') => {
      const response = await request(`${config.url}${path}`, {
        method,
        headers: {
          apikey: privileged ? config.serviceKey : config.publicKey,
          Authorization: privileged
            ? `Bearer ${config.serviceKey}`
            : authorization,
          'Content-Type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(15_000),
      })
      const result = await response.json().catch(() => null)
      return { ok: response.ok, status: response.status, data: result }
    }
    try {
      // Verify the bearer token with Auth, then check live database permission + AAL2.
      const identity = await call('/auth/v1/user', undefined, false, 'GET')
      if (!identity.ok || !uuid.test(identity.data?.id ?? ''))
        return reply({ error: 'Sesión no válida.' }, 401)
      const permission = await call('/rest/v1/rpc/has_permission', {
        p_permission: 'usuarios.gestionar',
      })
      if (!permission.ok || permission.data !== true)
        return reply({ error: 'Acceso no autorizado.' }, 403)
      const raw = await req.text()
      if (raw.length > 4096)
        return reply({ error: 'Solicitud demasiado grande.' }, 413)
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        return reply({ error: 'Solicitud inválida.' }, 400)
      }
      if (body?.action === 'remove') {
        if (
          !uuid.test(body.id ?? '') ||
          typeof body.version !== 'string' ||
          !Number.isFinite(Date.parse(body.version))
        )
          return reply({ error: 'Datos de usuario inválidos.' }, 400)
        if (body.id === identity.data.id)
          return reply(
            { error: 'Otro administrador debe quitar tu acceso.' },
            403,
          )
        // The database removes access first, under the caller's own permissions.
        const removed = await call('/rest/v1/rpc/admin_remove_user', {
          p_id: body.id,
          p_version: body.version,
        })
        if (!removed.ok)
          return reply(
            {
              error:
                'No se pudo quitar al usuario. Actualizá el listado: puede haber cambiado o ser el último administrador general.',
            },
            409,
          )
        // Then block sign-in so no new session can be opened or refreshed.
        const auth = await call(
          `/auth/v1/admin/users/${body.id}`,
          { ban_duration: '876000h' },
          true,
          'PUT',
        )
        if (!auth.ok)
          return reply({
            ok: true,
            warning:
              'El usuario ya no tiene acceso al panel, pero no se pudo bloquear su ingreso. Revisá la cuenta en Supabase Auth.',
          })
        return reply({ ok: true })
      }
      if (
        !body ||
        !['invite', 'update'].includes(body.action) ||
        !Array.isArray(body.roles) ||
        body.roles.length < 1 ||
        body.roles.length > 10 ||
        !body.roles.every((id) => typeof id === 'string' && uuid.test(id))
      )
        return reply({ error: 'Revisá los roles seleccionados.' }, 400)
      let userId = body.id
      let recoverExisting = false
      if (body.action === 'invite') {
        if (
          typeof body.email !== 'string' ||
          body.email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
        )
          return reply({ error: 'Correo inválido.' }, 400)
        const limit = await call('/rest/v1/rpc/admin_allow_invitation', {})
        if (!limit.ok || limit.data !== true)
          return reply(
            { error: 'Esperá antes de enviar otra invitación.' },
            429,
          )
        const target = await call('/rest/v1/rpc/admin_invitation_target', {
          p_email: body.email,
          p_roles: body.roles,
        })
        if (!target.ok || !target.data)
          return reply({ error: 'Revisá los roles seleccionados.' }, 400)
        if (target.data.registered)
          return reply(
            {
              error:
                'El usuario ya tiene acceso registrado. Buscalo en Usuarios para modificarlo.',
            },
            409,
          )
        userId = target.data.existing_id
        recoverExisting = Boolean(userId)
        // An interrupted invitation can be retried without duplicating the Auth account.
        if (!recoverExisting) {
          const invitation = await call(
            `/auth/v1/invite?redirect_to=${encodeURIComponent(`${config.siteUrl}/admin/establecer-clave`)}`,
            { email: body.email.trim() },
            true,
          )
          if (!invitation.ok)
            return reply(
              {
                error:
                  'No se pudo invitar. Revisá el correo y la configuración de envío.',
              },
              400,
            )
          userId = invitation.data?.id
        }
        if (!uuid.test(userId ?? ''))
          return reply({ error: 'No se pudo completar la invitación.' }, 502)
      } else if (
        !uuid.test(userId ?? '') ||
        typeof body.active !== 'boolean' ||
        typeof body.version !== 'string' ||
        !Number.isFinite(Date.parse(body.version))
      )
        return reply({ error: 'Datos de usuario inválidos.' }, 400)
      if (userId === identity.data.id)
        return reply(
          { error: 'Otro administrador debe modificar tu acceso.' },
          403,
        )
      const saved = await call('/rest/v1/rpc/admin_save_user', {
        p_id: userId,
        p_roles: body.roles,
        p_active: body.action === 'invite' ? true : body.active,
        p_version: body.action === 'invite' ? null : body.version,
      })
      if (!saved.ok)
        return reply(
          {
            error:
              'No se pudo asignar el acceso. Actualizá el listado y revisá los roles.',
          },
          409,
        )
      if (body.action === 'update') {
        const auth = await call(
          `/auth/v1/admin/users/${userId}`,
          { ban_duration: body.active ? 'none' : '876000h' },
          true,
          'PUT',
        )
        if (!auth.ok)
          return reply({
            ok: true,
            warning:
              'El acceso en la base de datos quedó actualizado, pero no se pudo sincronizar el bloqueo de ingreso. Revisá el usuario en Supabase Auth.',
          })
      }
      if (recoverExisting) {
        // Someone removed earlier is banned in Auth; a new invitation lifts that block.
        const unban = await call(
          `/auth/v1/admin/users/${userId}`,
          { ban_duration: 'none' },
          true,
          'PUT',
        )
        if (!unban.ok)
          return reply({
            ok: true,
            warning:
              'El acceso quedó asignado, pero no se pudo desbloquear el ingreso. Revisá la cuenta en Supabase Auth.',
          })
        const recovery = await call(
          `/auth/v1/recover?redirect_to=${encodeURIComponent(`${config.siteUrl}/admin/establecer-clave`)}`,
          { email: body.email.trim() },
        )
        if (!recovery.ok)
          return reply({
            ok: true,
            warning:
              'El acceso quedó asignado. No se pudo enviar el correo; el usuario puede solicitarlo desde «Olvidé mi contraseña».',
          })
      }
      return reply({ ok: true })
    } catch {
      return reply(
        { error: 'No se pudo completar la operación. Intentá nuevamente.' },
        503,
      )
    }
  }
}
