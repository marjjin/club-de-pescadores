# 0016 — Correos de Auth enviados por Resend

Estado: aceptada y aplicada el 12 de noviembre de 2026: dominio verificado en Resend, SMTP configurado y plantillas publicadas con `supabase config push`. Falta la prueba de envío (paso 6).

## Contexto

El panel envía tres correos de Supabase Auth: invitación, recuperación de contraseña y cambio de correo. Hasta ahora salían por el servidor de correo de prueba de Supabase, que tiene un límite muy bajo de envíos por hora, no usa un remitente del club y suele terminar en spam. Sin un SMTP real no se puede invitar al equipo de forma confiable (ver `docs/admin.md`).

## Decisión

- Usar Resend como servidor SMTP de Supabase Auth. Supabase sigue generando los enlaces y controlando su vencimiento; Resend solo entrega el correo.
- No agregar código ni dependencias: el envío se configura en el Dashboard de Supabase. No hace falta una Edge Function mientras los únicos correos sean los de Auth.
- Enviar desde el dominio del club, `clubdepescadores.com`, verificado en Resend con registros SPF y DKIM. Remitente: `no-responder@clubdepescadores.com`, nombre «Club de Pescadores San Nicolás».
- Versionar las plantillas en `supabase/templates/` y referenciarlas desde `supabase/config.toml`. Usan solo variables de Supabase (`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`), estilos en línea y textos en español rioplatense.
- La Site URL de Auth es `https://www.clubdepescadores.com`. Las URLs de retorno permiten las rutas del panel en ese dominio y en `club-de-pescadores.vercel.app`, para que sigan funcionando los enlaces ya enviados. Ambas se declaran en `config.toml`.
- La API key de Resend es un secreto: solo se carga en el Dashboard de Supabase. Nunca en el repositorio, en `.env` ni en variables `VITE_`.

## Pasos

1. **Resend → Domains:** agregar `clubdepescadores.com`, cargar en el DNS del dominio los registros que indica Resend (SPF y DKIM) y esperar el estado «Verified». Recomendado: agregar también un registro DMARC (`_dmarc`) con política `p=none` para empezar a monitorear.
2. **Resend → API Keys:** crear una key con permiso **Sending access** limitado al dominio `clubdepescadores.com`. No usar una key con «Full access».
3. **Supabase → Authentication → Emails → SMTP Settings:** habilitar SMTP personalizado con:
   - Host: `smtp.resend.com`
   - Puerto: `465`
   - Usuario: `resend`
   - Contraseña: la API key del paso 2
   - Remitente: `no-responder@clubdepescadores.com`
   - Nombre del remitente: `Club de Pescadores San Nicolás`
4. **Supabase → Authentication → Rate Limits:** revisar el límite de correos por hora. Con SMTP propio se puede subir; mantenerlo bajo (por ejemplo, 30 por hora) para frenar abusos de «Olvidé mi contraseña».
5. **Supabase → Authentication → Emails → Templates:** copiar el asunto y el HTML de cada plantilla de `supabase/templates/` (invitación, restablecer contraseña y cambio de correo). Alternativa: `supabase config push`, después de revisar el diff completo, porque publica toda la configuración de `config.toml`.
6. **Probar en producción:** invitar a una cuenta de prueba, pedir recuperación de contraseña y cambiar un correo. Revisar que lleguen a la bandeja de entrada (no a spam), que los enlaces abran `/admin/establecer-clave` o `/admin/cuenta`, y los logs en Resend → Emails.

## Consecuencias

Las invitaciones y recuperaciones dependen de Resend y de que el dominio siga verificado. Si se cambia el DNS del dominio, hay que conservar sus registros. El plan gratuito de Resend tiene un límite diario y mensual de envíos, suficiente para el volumen del panel. Hay que revisarlo si en el futuro se agregan correos a socios.

Si más adelante se suman correos propios (formulario de contacto, avisos al equipo), se enviarán desde una Edge Function con la API key como secreto del servidor, con límite de intentos y CAPTCHA en los formularios públicos.

Referencias oficiales: [SMTP de Resend con Supabase](https://resend.com/docs/send-with-supabase-smtp), [SMTP personalizado en Supabase](https://supabase.com/docs/guides/auth/auth-smtp) y [plantillas de correo de Auth](https://supabase.com/docs/guides/auth/auth-email-templates).
