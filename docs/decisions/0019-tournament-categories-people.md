# Torneos: agenda, categorías, registro de personas y eliminación

El 17 de noviembre de 2026 el propietario pidió que los torneos aparezcan en Eventos, poder asignarles categorías (Senior, Cadetes…), guardar a los participantes con nombre, apellido y DNI para futuros torneos, corregir una inscripción cargada con la persona equivocada y eliminar torneos.

## Agenda (`202611170002_tournament_events.sql`)

- Cada torneo tiene un evento derivado (`events.tournament_id`), que crea y actualiza un trigger. Se ve en el sitio mientras el torneo está publicado o finalizado, y se oculta si vuelve a borrador o se archiva.
- El torneo suma una hora de inicio obligatoria (`start_time`, hora argentina). Si no tiene lugar, el evento usa «Club de Pescadores San Nicolás».
- El evento no se puede modificar desde Eventos: lo impide un trigger en la base de datos y el panel lo muestra con «Gestionar en Torneos». La tarjeta pública lleva a la tabla de posiciones.
- Los torneos anteriores recibieron su evento sin hora (`show_time = false`) hasta que se les cargue una.

## Categorías y personas (`202611170003_tournament_categories_anglers.sql`)

- Hay un catálogo de categorías (`tournament_categories`) con archivado, y cada torneo tiene entre 1 y 10. Cada categoría tiene su propia tabla y sus propios puestos. Una persona puede competir en varias categorías del mismo torneo, una vez por categoría.
- El registro `anglers` guarda nombre, apellido y DNI (7 u 8 dígitos, único). En la tabla pública se publica «Nombre I.», como antes.
- **Ley 25.326:** el DNI sirve solo para identificar a la persona. Nunca se publica, no se lee directamente (RLS deniega la lectura de la tabla) y en los listados y la auditoría aparece tapado (`••••3456`). Lo ve completo solo quien tiene `torneos.participantes`, al abrir los datos de la persona o al buscarla por su DNI exacto.
- Una inscripción puede cambiar de persona (conserva sus puntos, que fueron de quien realmente compitió) o de categoría. Corregir los datos de una persona actualiza su nombre en todas las tablas.
- Todo lo cargado antes de este cambio quedó en la categoría «General». Las inscripciones anteriores aparecen como «Sin ficha» y se pueden vincular a una persona.
- `tournament_leaderboard` y `tournament_admin_participants` agregan `p_category` como último parámetro opcional, así el sitio sigue funcionando entre la migración y el nuevo despliegue.

## Eliminación (`202611170004_tournament_delete.sql`)

- Solo se elimina definitivamente un torneo **archivado**, en dos pasos y con confirmación. Se borran sus puntos, inscripciones, categorías asignadas y su evento; las personas siguen registradas. Los triggers de auditoría guardan una copia de cada fila borrada.

## Orden de despliegue

Primero aplicar las migraciones y después publicar el frontend: el sitio nuevo pide las columnas y funciones nuevas. El sitio anterior sigue funcionando con la base nueva, salvo el alta de participantes del panel, que cambia de firma.
