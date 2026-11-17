# Tablas anuales de torneos

El 17 de noviembre de 2026 el propietario pidió una tabla anual a la que se pueda vincular cada torneo, con una tabla por categoría, y poder crearla desde la sección Torneos del panel.

## Reglas elegidas

- **Puntos:** se suman los puntos que cada persona hizo en cada torneo vinculado (no puntos por puesto).
- **Varias tablas por año**, cada una con nombre (por ejemplo «Campeonato anual 2026» y «Copa de invierno 2026»). El nombre es único dentro de cada año.
- **Una tabla por categoría del torneo:** cada categoría elige su propia tabla anual (por ejemplo, Mayores suma a «Tabla anual Mayores 2026» y Seniors a «Tabla anual Seniors 2026»), o ninguna. Dentro de una tabla, cada categoría tiene sus propias posiciones.
- **Solo torneos finalizados:** un torneo publicado o en curso aparece en la página de la tabla como «Suma al finalizar», pero no suma.

## Modelo (`202611170007_annual_tables.sql`)

- `annual_tables` (nombre, año, archivado). Se lee y se escribe solo con funciones: `annual_table_list/save/archive` en el panel (`torneos.ver` / `torneos.gestionar`) y `annual_tables_public`, `annual_table_get` y `annual_standings` en el sitio.
- El vínculo está en cada categoría del torneo (`tournament_category_links.annual_table_id`). `tournament_save` recibe `annual_tables`, un mapa de categoría a tabla (`null` para que no sume). Las categorías que no vienen en el mapa, o un panel que no lo envía, conservan lo guardado.
- `202611170008_annual_tables_per_category.sql` pasó el vínculo del torneo a sus categorías: la primera versión permitía una sola tabla por torneo. Las categorías que sumaban conservaron su tabla.
- La tabla se **calcula al leerla**: no hay puntajes copiados que se puedan desincronizar. Corregir puntos, mover a alguien de categoría o desvincular un torneo corrige la tabla anual sola.
- Las personas se agrupan por su ficha (DNI). Las inscripciones «Sin ficha» no suman: el panel muestra cuántas hay en cada tabla para vincularlas a una persona.
- Archivar una tabla la saca del sitio e impide vincularle torneos nuevos. No se borra: los torneos conservan su vínculo y se puede restaurar.

## Privacidad (Ley 25.326)

El sitio muestra solo el nombre público («Ana G.»), los puntos, la cantidad de torneos y el puesto. No devuelve DNI ni identificadores de personas, así que no se puede seguir a alguien entre tablas a partir de la página pública.
