# Tablas anuales de torneos

El 17 de noviembre de 2026 el propietario pidió una tabla anual a la que se pueda vincular cada torneo, con una tabla por categoría, y poder crearla desde la sección Torneos del panel.

## Reglas elegidas

- **Puntos:** se suman los puntos que cada persona hizo en cada torneo vinculado (no puntos por puesto).
- **Varias tablas por año**, cada una con nombre (por ejemplo «Campeonato anual 2026» y «Copa de invierno 2026»). El nombre es único dentro de cada año.
- **Misma categoría, misma tabla:** lo que alguien hace en «Mayores» suma a la tabla anual de Mayores. Al vincular el torneo se eligen qué categorías suman; por defecto, todas.
- **Solo torneos finalizados:** un torneo publicado o en curso aparece en la página de la tabla como «Suma al finalizar», pero no suma.

## Modelo (`202611170007_annual_tables.sql`)

- `annual_tables` (nombre, año, archivado). Se lee y se escribe solo con funciones: `annual_table_list/save/archive` en el panel (`torneos.ver` / `torneos.gestionar`) y `annual_tables_public`, `annual_table_get` y `annual_standings` en el sitio.
- Cada torneo tiene como máximo una tabla (`tournaments.annual_table_id`), y cada categoría del torneo indica si suma (`tournament_category_links.counts_annual`). `tournament_save` recibe `annual_table` y `annual_categories`; si no los recibe, conserva lo guardado, así un panel viejo no cambia nada.
- La tabla se **calcula al leerla**: no hay puntajes copiados que se puedan desincronizar. Corregir puntos, mover a alguien de categoría o desvincular un torneo corrige la tabla anual sola.
- Las personas se agrupan por su ficha (DNI). Las inscripciones «Sin ficha» no suman: el panel muestra cuántas hay en cada tabla para vincularlas a una persona.
- Archivar una tabla la saca del sitio e impide vincularle torneos nuevos. No se borra: los torneos conservan su vínculo y se puede restaurar.

## Privacidad (Ley 25.326)

El sitio muestra solo el nombre público («Ana G.»), los puntos, la cantidad de torneos y el puesto. No devuelve DNI ni identificadores de personas, así que no se puede seguir a alguien entre tablas a partir de la página pública.
