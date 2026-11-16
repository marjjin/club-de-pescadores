# Sección de instalaciones editable

El 17 de noviembre de 2026 el propietario pidió poder modificar la sección «Un espacio pensado para los socios» del inicio, con sus fotos y textos. Eligió poder editar todo (título, bajada y tarjetas, con altas, bajas y orden) y un permiso propio asignable por rol.

## Datos

- `facility_sections`: una sola fila con el título y la bajada.
- `facilities`: hasta ocho tarjetas ordenadas por `position`, con título (40), descripción (160) y texto alternativo (200). Cada tarjeta tiene exactamente una foto: `image_path` (archivo subido al bucket `club-media`) o `default_image` (`pier`, `hall`, `grill`, `river`, las fotos que vienen con el sitio). La migración carga las cuatro tarjetas originales con sus fotos incluidas, así el sitio no cambia al aplicarla.

Las dos tablas tienen lectura pública con RLS y escritura denegada. No guardan quién editó; eso queda en `audit_logs`.

## Permisos

`instalaciones.ver` abre la sección del panel en modo lectura e `instalaciones.editar` permite guardar. Como los demás módulos, editar exige también el permiso de lectura, y lo valida `admin_save_role`. El administrador general tiene los dos. `can_manage_media()` incluye `instalaciones.editar` para poder subir fotos al bucket compartido.

## Guardado

`admin_save_facilities(p_data, p_version)` reemplaza el encabezado y la lista completa en una transacción, con el control de versión de `facility_sections.updated_at`. Las tarjetas existentes conservan su `id`, para que la auditoría siga a cada una. Una foto se acepta solo si ya se mostraba en la sección o si la subió quien guarda, igual que en noticias y en el parte del muelle.

Las fotos en uso nunca se borran: `club_media_in_use()` las protege de la política de borrado y `admin_prune_club_media()` no las cuenta como abandonadas. Una foto subida y no guardada se limpia a las 24 horas, con el mismo mecanismo que ya existía.

## Sitio público

La sección lee las dos tablas con el cliente PostgREST de solo lectura, con cinco minutos de caché. Mientras carga muestra un esqueleto del mismo tamaño para no mover la página. Si la consulta falla o devuelve datos inválidos, muestra el contenido original incluido en el sitio. Las fotos subidas se sirven desde Storage con caché de un año y nombres únicos.
