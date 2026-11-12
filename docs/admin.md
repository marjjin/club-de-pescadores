# Panel de administrador general

El código del panel está implementado en `/admin`. La matriz fue aprobada el 8 de noviembre de 2026. Los paneles de otros perfiles quedan fuera de esta etapa.

La versión local no crea automáticamente tablas en Supabase, no publica el frontend y no crea una cuenta con contraseña predeterminada. El propietario debe completar la instalación con un acceso autorizado al proyecto. Nunca poner una clave de servicio en Vercel/Vite ni compartir contraseñas por el chat.

## Funciones

- Ingreso, recuperación de contraseña, aceptación de invitación y segundo factor TOTP obligatorio.
- Resumen con agregaciones reales de contenido y usuarios.
- Noticias, eventos y tarifas: crear, editar, publicar, programar noticias, archivar y restaurar como borrador. Confirmación de publicación y archivado; detección de edición concurrente.
- Noticias: vista previa, URL HTTPS o carga de imágenes JPG/PNG/WebP optimizadas. Tamaño máximo 5 MB, nombres aleatorios y escritura restringida por permisos en Storage.
- Usuarios: invitación, múltiples roles, activación y desactivación. El administrador no modifica su propio acceso. No se puede dejar el sistema sin administrador general activo mediante las operaciones del panel.
- Roles personalizados con permisos de contenido y auditoría. Gestión de accesos reservada al rol general protegido. Los otros roles pueden configurar su cuenta, pero no entran al panel general.
- Auditoría de cambios en contenido, roles y asignaciones. Consulta paginada por fecha, filtro por sección y comparación del estado anterior/posterior. Sin edición ni borrado desde el panel.
- Cambio de correo de acceso con confirmación, cambio de contraseña y cierre de sesiones. El cambio de correo conserva el UUID, los roles y el estado activo de la cuenta.

Los filtros y cursores se procesan en Postgres. Cada página muestra veinte registros y solicita uno adicional para determinar si hay otra página. Las búsquedas de contenido usan texto completo en español; usuarios y catálogos usan prefijo. No se descargan tablas completas.

Los listados de noticias, eventos y tarifas usan pestañas de estado y búsqueda explícita mediante «Buscar» o Enter. El estado vacío ofrece una acción para crear contenido; las búsquedas sin resultados permiten limpiar filtros y los errores de conexión permiten reintentar. La paginación aparece cuando hay otra página. Las noticias muestran imagen, extracto y estado; las programadas indican su fecha de publicación.

El editor de noticias separa texto, imagen y publicación. La portada se puede seleccionar o arrastrar; el enlace HTTPS es una alternativa desplegable. El título y el texto muestran sus límites y los errores se indican en cada campo. La vista previa se actualiza al escribir y se puede ampliar sin guardar. Las opciones distinguen borrador, publicación inmediata y programación con fecha futura en hora de Argentina. Guardar un borrador completo no exige elegir una fecha; editar una noticia publicada conserva su fecha original. Los botones de salida confirman el descarte de cambios y se solicita confirmación antes de publicar, programar o retirar una publicación.

El editor de eventos sigue el mismo esquema: día y hora por separado en hora de Argentina, aviso si la fecha ya pasó, descripción opcional de hasta 600 caracteres, vista previa con el formato de la agenda pública y opciones de borrador o publicación. La descripción requiere la migración `202611080009_event_description.sql`, que debe aplicarse antes de desplegar el frontend porque la agenda pública la solicita.

## Instalar el esquema

La migración pública `202611080001_public_content.sql` ya se aplicó durante la activación del sitio. **No volver a ejecutarla ni usar `db reset` en producción.** Si se aplicó mediante SQL Editor, registrar su versión en el historial antes de usar `supabase db push`.

Aplicar una sola vez, en este orden, las migraciones pendientes:

1. `202611080002_admin.sql`: roles, permisos, usuarios, auditoría y funciones verificadas.
2. `202611080003_admin_images.sql`: bucket de imágenes y políticas.
3. `202611080004_invitation_limits.sql`: límite de diez intentos de invitación por hora por administrador.
4. `202611080005_admin_invitation_recovery.sql`: auditoría con correo del actor y recuperación de invitaciones interrumpidas.
5. `202611080006_admin_email_sync.sql`: sincronización del correo confirmado de Auth con la cuenta administrativa, sin modificar permisos.
6. `202611080007_invitation_limits_rls.sql`: activa RLS en el contador privado de invitaciones. También se puede aplicar si SQL Editor ya lo activó al ejecutar `004`.
7. `202611080008_rls_helper_permissions.sql`: retira permisos de ejecución del navegador sobre el helper opcional de RLS creado por SQL Editor; conserva su funcionamiento como event trigger.

Si alguna ya fue aplicada, continuar desde la siguiente. Usar la integración o CLI de Supabase con acceso al proyecto `rjzmcwfwfxtktuleqzgf`. SQL Editor también permite ejecutar cada archivo completo, una vez, y registrar después las versiones en el historial de migraciones.

## Configurar Auth y correos

En el Dashboard de Supabase:

1. **Authentication → URL Configuration:** Site URL `https://club-de-pescadores.vercel.app`. Permitir `https://club-de-pescadores.vercel.app/admin/establecer-clave` y `https://club-de-pescadores.vercel.app/admin/cuenta` como Redirect URLs. Para pruebas locales, agregar las URL equivalentes del puerto usado por Vite.
2. Deshabilitar el registro público de nuevas cuentas y las cuentas anónimas; los administradores se crean por invitación del propietario o del panel.
3. Habilitar MFA por aplicación autenticadora (TOTP). El panel y las funciones de base de datos exigen AAL2 para operaciones administrativas.
4. Configurar Resend como SMTP real con el remitente `no-responder@clubdepescadores.com` y las plantillas de `supabase/templates/`, según [0016](decisions/0016-resend-auth-email.md). El servicio de correo de prueba de Supabase no sustituye un SMTP de producción para invitar al equipo.
5. Configurar límites de autenticación, contraseña mínima de doce caracteres y protección de contraseñas filtradas cuando el plan lo permita. El frontend usa Auth directamente y sus límites de servidor. CAPTCHA no está integrado en esta versión: no activar un desafío obligatorio en Auth sin integrar también su widget y token en el formulario.
6. Mantener **Secure email change** habilitado en el proveedor Email: el usuario confirma el cambio desde el correo actual y el nuevo. Revisar las plantillas y la entrega de ambos mensajes antes de habilitar este flujo en producción.

Los enlaces de invitación y recuperación usan el flujo de sesión de Supabase y `/admin/establecer-clave`. Si el usuario ya tiene TOTP, primero debe verificarlo. Los tokens no se envían a herramientas de analítica. El frontend no guarda secretos TOTP: solo muestra el QR y la clave durante el enrolamiento.

## Desplegar la función de usuarios

La función está en `supabase/functions/admin-users/`. Usando la CLI autenticada y vinculada al proyecto:

```bash
supabase secrets set ADMIN_SITE_URL=https://club-de-pescadores.vercel.app
supabase functions deploy admin-users --project-ref rjzmcwfwfxtktuleqzgf
```

Los secretos estándar `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los proporciona el entorno de Edge Functions. No copiarlos al frontend. `ADMIN_SITE_URL` fija el origen permitido y el destino de los correos; no se acepta una URL de retorno del navegador.

`supabase/config.toml` desactiva el verificador JWT antiguo de la puerta de entrada para esta función. **No significa acceso anónimo:** el handler exige Bearer, verifica el token contra Auth y consulta `has_permission('usuarios.gestionar')` con el JWT del solicitante antes de usar la clave de servicio. La asignación final vuelve a validar permisos dentro de la transacción de base de datos.

Desactivar un usuario primero revoca su acceso en Postgres; después se sincroniza el bloqueo en Auth. Si el segundo paso falla, la interfaz informa la sincronización pendiente y el acceso a los datos administrativos permanece bloqueado. El propietario debe corregir el bloqueo desde Auth. Un token de acceso ya emitido puede seguir existiendo hasta su vencimiento; no permite eludir la comprobación de cuenta activa.

Una invitación interrumpida puede reintentarse: si ya existe la cuenta de Auth pero no su acceso administrativo, se asignan los permisos y se envía recuperación de contraseña. Si el correo falla después de asignar permisos, el usuario puede solicitarlo desde el ingreso. No se duplican cuentas ni se otorgan permisos antes de validar el administrador.

## Crear el primer administrador

No hay usuario ni contraseña incorporados al código. Usar el correo real indicado por el propietario:

El correo inicial indicado por el propietario se preparó en `supabase/bootstrap-admin.local.sql`, un archivo local ignorado por Git. No se incorpora al frontend ni se usa como correo público del club. Ese archivo prepara el alta; no significa que la cuenta remota ya exista.

1. En **Authentication → Users**, crear o invitar la cuenta. No inventar un correo. Si se usa la invitación del Dashboard, comprobar su destino; el usuario también puede usar «Olvidé mi contraseña» después de publicar `/admin`.
2. Ejecutar una sola vez desde SQL Editor, como propietario, sustituyendo el marcador:

```sql
select public.bootstrap_admin('[CORREO_REAL_DEL_PROPIETARIO]');
```

3. Publicar el frontend en Vercel con las tres variables públicas ya configuradas. No agregar secretos administrativos a `VITE_*`.
4. Abrir `https://club-de-pescadores.vercel.app/admin`, solicitar el correo de recuperación si hace falta, establecer una contraseña y configurar la aplicación autenticadora.

`bootstrap_admin` no es ejecutable por `anon` ni `authenticated`, y se rechaza si ya existe alguna cuenta administrativa. Los siguientes administradores se designan desde Usuarios, mediante otra cuenta general.

Si se pierde el último dispositivo MFA, la recuperación requiere intervención del propietario del proyecto en Supabase Auth. No hay una ruta pública para saltarse MFA o convertirse en administrador.

## Cambiar el correo de acceso

Desde **Mi cuenta → Cambiar correo de acceso**, ingresar y repetir la nueva dirección. Se requiere una sesión activa con segundo factor. Completar las confirmaciones del correo actual y del nuevo; hasta entonces se sigue ingresando con el correo anterior.

El trigger de la migración `006` escucha únicamente cambios en `auth.users.email`, no solicitudes pendientes en `email_change` ni metadatos del navegador. Actualiza la dirección de `admin_accounts` y el cambio queda auditado. No crea otra cuenta, no reactiva usuarios deshabilitados y no cambia sus roles. El correo público de contacto del club es independiente.

Este comportamiento usa el [flujo oficial de cambio de usuario de Supabase](https://supabase.com/docs/reference/javascript/auth-updateuser). Si el cambio corresponde a otra persona que asumirá la administración, es preferible invitarla con su propia cuenta para conservar la atribución individual de la auditoría.

## Verificación antes de habilitar producción

- Ejecutar `npm run check`. Prueba el esquema local con roles reales de PostgreSQL aislado, los RPC, Storage RLS, el handler HTTP y los flujos de interfaz con Auth/API simulados.
- Ejecutar `npm run production:check` para verificar que el sitio público sigue leyendo Supabase.
- Ejecutar `npm run admin:check` para comprobar que los endpoints administrativos existen y deniegan al visitante anónimo. No certifica MFA ni permisos de una cuenta real.
- Revisar Security Advisor, backups y planes `EXPLAIN ANALYZE` de las consultas administrativas con el volumen real. PGlite simula los esquemas de Auth/Storage y no reproduce el servicio remoto de correos, límites de Storage ni sesiones de GoTrue.
- En un navegador real, probar invitación y recuperación, MFA, alta y edición, publicación, papelera, roles, desactivación y navegación móvil/teclado. Confirmar que una cuenta sin permisos no puede leer datos administrativos ni llamar a los RPC de escritura.
- Las rutas `/admin/*` se sirven con `no-store` y `X-Robots-Tag: noindex, nofollow`. La entrada administrativa está fuera del JavaScript inicial del sitio público.

Durante la activación se confirmó el acceso remoto por CLI, se desplegó `admin-users` y se verificaron sus rechazos de sesiones ausentes o inválidas. Los endpoints de datos administrativos también deniegan al visitante anónimo. El ingreso real con contraseña y MFA y el despliegue del frontend se verifican por separado; un build local no certifica esos flujos.

Security Advisor marca las funciones administrativas `SECURITY DEFINER` accesibles por `authenticated`: es intencional y sus permisos internos, cuenta activa y AAL2 están cubiertos por las pruebas. También detectó la protección contra contraseñas filtradas desactivada en Auth; su activación según el plan sigue pendiente. La advertencia del helper de RLS se corrige mediante la migración `008`.

Referencias oficiales: [MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp), [protección de Edge Functions](https://supabase.com/docs/guides/functions/auth), [invitaciones](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) y [políticas de Storage](https://supabase.com/docs/guides/storage/security/access-control).
