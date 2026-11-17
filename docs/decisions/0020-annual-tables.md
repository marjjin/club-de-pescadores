# Tablas anuales de torneos

El 17 de noviembre de 2026 el propietario pidió una tabla anual a la que se pueda vincular cada torneo, con una tabla por categoría, y poder crearla desde la sección Torneos del panel.

## Reglas elegidas

- **Puntos:** se suman los puntos que cada persona hizo en cada torneo vinculado (no puntos por puesto).
- **Varias tablas por año**, cada una con nombre (por ejemplo «Campeonato anual 2026» y «Copa de invierno 2026»). El nombre es único dentro de cada año.
- **Tablas por categoría del torneo:** cada categoría elige a qué tablas anuales suma: ninguna, una o varias (por ejemplo, Mayores suma a «Tabla anual Mayores 2026» y a «Copa de invierno 2026», y Seniors a «Tabla anual Seniors 2026»). Dentro de una tabla, cada categoría tiene sus propias posiciones.
- **Solo torneos finalizados:** un torneo publicado o en curso aparece en la página de la tabla como «Suma al finalizar», pero no suma.

- **Categorías predeterminadas:** cada tabla anual puede indicar qué categorías suman (`annual_table_categories`). Al agregar una categoría a un torneo, el panel la vincula sola a esas tablas, y en el formulario cada categoría muestra solo las tablas que la aceptan. Una tabla sin categorías acepta cualquiera. Cambiar las categorías de una tabla no toca los vínculos ya guardados (`202611170010`).

## Modelo (`202611170007_annual_tables.sql`)

- `annual_tables` (nombre, año, archivado). Se lee y se escribe solo con funciones: `annual_table_list/save/archive` en el panel (`torneos.ver` / `torneos.gestionar`) y `annual_tables_public`, `annual_table_get` y `annual_standings` en el sitio.
- Los vínculos están en `tournament_category_annual` (torneo, categoría, tabla anual), que se borra en cascada si la categoría sale del torneo. `tournament_save` recibe `annual_tables`, un mapa de categoría a lista de tablas (`[]` para que no sume; también acepta un id suelto o `null`, como el panel anterior). Las categorías que no vienen en el mapa, o un panel que no lo envía, conservan lo guardado.
- Historia: la primera versión permitía una tabla por torneo; `202611170008` la pasó a una por categoría y `202611170009` a varias por categoría. En cada paso se conservaron los vínculos existentes.
- La tabla se **calcula al leerla**: no hay puntajes copiados que se puedan desincronizar. Corregir puntos, mover a alguien de categoría o desvincular un torneo corrige la tabla anual sola.
- Las personas se agrupan por su ficha (DNI). Las inscripciones «Sin ficha» no suman: el panel muestra cuántas hay en cada tabla para vincularlas a una persona.
- Archivar una tabla la saca del sitio e impide vincularle torneos nuevos. No se borra: los torneos conservan su vínculo y se puede restaurar.
- Eliminar (`202611170011`): una tabla anual se elimina solo después de archivarla, y se borran sus vínculos y categorías predeterminadas, nunca torneos ni puntos. Una categoría se elimina solo si ningún torneo la usa; si no, se archiva.

## Privacidad (Ley 25.326)

El sitio muestra solo el nombre público («Ana G.»), los puntos, la cantidad de torneos y el puesto. No devuelve DNI ni identificadores de personas, así que no se puede seguir a alguien entre tablas a partir de la página pública.
