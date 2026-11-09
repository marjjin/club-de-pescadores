# Altura del río gestionada por el club

Una franja debajo del encabezado público muestra la última medición publicada: altura en metros, punto de referencia, fuente y fecha y hora argentina. El administrador general la carga manualmente en `/admin/rio`. No se incorporan valores ficticios, consultas automáticas a terceros, umbrales de alerta ni interpretaciones de seguridad de navegación.

El resumen del panel tiene dos accesos: «Publicar noticia del muelle» abre `/admin/noticias/nueva`, con la foto y el texto de las condiciones; «Actualizar altura del río» abre la medición. Las publicaciones del muelle usan las mismas noticias, imágenes, permisos y estados de publicación que el resto del contenido. No se precargan observaciones ni se publican datos de ejemplo.

La sección del río no ofrece un campo para publicar condiciones del muelle. Las notas ya guardadas se conservan por compatibilidad, sin editarlas ni mostrarlas en la franja pública. Esta separación no requiere otra migración ni elimina información existente.

`river_levels` conserva una única medición actual, protegida con RLS y políticas explícitas. La altura se guarda en centímetros enteros para evitar errores de coma flotante. Se admiten valores negativos, hasta dos decimales y un límite técnico de ±100 metros; ese límite no representa una clasificación hidrológica. Los campos obligatorios y límites se comprueban en Zod y PostgreSQL. Las fechas futuras se rechazan.

El permiso reservado `rio.gestionar` solo está disponible para administradores generales activos con MFA, mediante la función de permisos existente. No se habilitan paneles adicionales ni se amplía el acceso de los roles personalizados. Las escrituras del navegador siguen revocadas: las RPC verifican permisos, serializan cambios y comprueban la versión para evitar sobrescribir otra edición. Los cambios anteriores quedan en auditoría.

La lectura pública pide como máximo una fila por clave primaria, con columnas explícitas, filtros de publicación, cancelación y timeout. La caché pública se actualiza cada minuto; la administrativa se separa por usuario. La interfaz indica que una medición tiene más de 24 horas y nunca cambia ese valor por una estimación. Ese plazo indica antigüedad, no un estándar técnico de vigencia. Los estados vacío, carga, error y reintento no muestran valores de reemplazo.

Activación: aplicar `supabase/migrations/202611080010_river_level.sql`, desplegar el frontend y ejecutar `npm run production:check`. No requiere cambios en variables de entorno. La primera medición debe cargarse y publicarse desde el panel con una fuente real. El build y las pruebas locales no aplican la migración al proyecto alojado.
