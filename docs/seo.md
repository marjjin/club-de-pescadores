# SEO del sitio público

Cómo llega el sitio a los buscadores y a las vistas previas de enlaces (WhatsApp, Facebook), qué hay que mantener y qué depende de configuraciones externas.

## Cómo se sirve cada página

| Dirección                                             | HTML                                                                                                                                                                   | Código                                               |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `/`, `/noticias`, `/eventos`, `/torneos`              | Pre-renderizado en el build (`src/entry-server.tsx`): cabecera, foto principal, títulos y textos fijos ya están en el HTML; el navegador lo hidrata y carga los datos. | 200                                                  |
| `/noticias/:id`, `/torneos/:id`, `/torneos/anual/:id` | `api/seo.js` (función de Vercel) arma el `<head>` con los datos reales de Supabase: título, descripción, imagen, datos estructurados.                                  | 200, o 404 si no es pública, o 503 si Supabase falla |
| `/sitemap.xml`                                        | `api/seo.js`, siempre actualizado (caché de 1 h en Vercel).                                                                                                            | 200                                                  |
| `/admin/...`                                          | Plantilla vacía, `X-Robots-Tag: noindex, nofollow`, sin caché.                                                                                                         | 200                                                  |
| Cualquier otra                                        | `404.html` con `noindex`; la app muestra «No encontramos esta página».                                                                                                 | 404                                                  |

Las rutas están en `vercel.json` (`routes`). **Una página pública nueva en `src/app/routes.tsx` también debe agregarse ahí**, o responderá 404.

## Metadatos

- Textos de cada página: `src/shared/seo/pages.mjs`, única fuente para el build, la función y la app.
- Etiquetas del `<head>` y JSON-LD: `src/shared/seo/head.mjs`.
- El HTML servido trae título, descripción, robots y canonical marcados con `data-seo`. La app renderiza los suyos y `src/app/serverHead.ts` borra cada copia del servidor recién cuando aparece la de la app: nunca hay dos títulos ni un momento sin descripción.
- Open Graph y Twitter Cards en todas las páginas; las noticias usan su foto. Imagen general: `og-image.jpg` (1200 × 630, JPEG para que la lean todos los servicios).

## Datos estructurados (JSON-LD)

Solo con información real publicada en el sitio:

- `SportsClub` + `WebSite` en todas las páginas: nombre, ciudad (San Nicolás de los Arroyos, Buenos Aires), teléfono, logo.
- `BreadcrumbList` en secciones, noticias y torneos.
- `NewsArticle` en cada noticia (fecha de publicación y de modificación, foto).
- `SportsEvent` en cada torneo (fechas, lugar, organizador).

No hay dirección exacta, horarios ni redes sociales porque el sitio no los publica: cuando el club los confirme, agregarlos a `CLUB` en `pages.mjs` (y al pie del sitio).

## Rendimiento (Lighthouse, celular, medido el 17/11/2026)

| Página  | Antes (producción)                   | Después (build local con compresión) |
| ------- | ------------------------------------ | ------------------------------------ |
| Inicio  | Rendimiento 79, LCP 4,1 s, CLS 0,151 | Rendimiento 93, LCP 2,8 s, CLS 0,005 |
| Torneos | —                                    | Rendimiento 97, LCP 2,3 s, CLS 0,005 |

Cambios: foto principal en el HTML y precargada, versión recortada de 67 KB para celular (antes bajaba la de 134 KB), lugar reservado para el parte del muelle y las tablas anuales mientras cargan.

Pendiente: las fotos subidas por el panel se sirven en tamaño completo aunque se muestren chicas (~300 KB de más en el inicio). Se resolvería con transformaciones de imagen de Supabase (plan pago) o generando miniaturas al subir.

## Google Search Console (requiere tu cuenta de Google)

1. Entrá a https://search.google.com/search-console y elegí **Agregar propiedad → Dominio**, con `clubdepescadores.com` (cubre `www` y sin `www`).
2. Google muestra un registro **TXT**. Agregalo en el DNS del dominio (donde lo compraste o en Vercel → Domains, si Vercel maneja el DNS) y tocá **Verificar**. Puede tardar unos minutos.
3. En **Sitemaps**, enviá `https://www.clubdepescadores.com/sitemap.xml`.
4. En **Inspección de URLs**, pegá la dirección del inicio, de `/torneos` y de una noticia. Revisá «La URL está en Google» y «Probar URL publicada» → «Ver página probada» para confirmar que se ve el contenido.
5. Si una página nueva tarda en aparecer, desde la misma inspección tocá **Solicitar indexación** (no hace falta hacerlo con cada noticia: el sitemap ya las informa).
6. **Indexación → Páginas** muestra qué no se indexó y por qué. Las de `/admin` y las 404 deben figurar como excluidas: es lo esperado.
7. **Rendimiento** muestra consultas, clics, impresiones y posición promedio. Mirarlo una vez por mes.

También conviene dar de alta el sitio en **Bing Webmaster Tools** (https://www.bing.com/webmasters), que permite importar la propiedad desde Search Console.

## Google Business Profile (ficha en Google Maps)

1. Entrá a https://business.google.com con la cuenta del club y buscá si ya existe una ficha del club (puede haberla creado alguien): si existe, reclamala.
2. Categoría principal sugerida: **Club deportivo** o **Club de pesca**; nombre exactamente «Club de Pescadores San Nicolás».
3. Cargá la dirección real, el teléfono 336 425 0033, el sitio `https://www.clubdepescadores.com`, horarios reales y fotos propias (muelle, quincho, pileta).
4. Google verifica por correo postal, llamada o video según el caso.
5. Publicá novedades y torneos también ahí, y respondé las reseñas.

## Autoridad y enlaces (sin código)

- Pedir un enlace al sitio desde la Municipalidad de San Nicolás (turismo y deportes), la federación o asociación de pesca deportiva a la que pertenezca el club, y clubes o comercios amigos (náuticas, casas de pesca).
- Usar siempre la misma dirección `https://www.clubdepescadores.com` en Instagram, Facebook y WhatsApp Business.
- Enviar a los medios locales las fechas y resultados de los torneos con el enlace a la tabla de posiciones.
- Publicar en el sitio las crónicas y resultados de cada torneo: es contenido propio que otros enlazan.
- No comprar enlaces ni usar directorios de spam: Google los penaliza.

## Búsquedas a las que apunta cada página

| Página   | Búsquedas principales                                     | Relacionadas                                                                          |
| -------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Inicio   | club de pescadores san nicolás, club de pesca san nicolás | muelle de pesca san nicolás, pileta club san nicolás, quincho y parrillas san nicolás |
| Torneos  | torneo de pesca san nicolás                               | tabla de posiciones torneo de pesca, torneo de pesca de 12 horas                      |
| Eventos  | eventos club de pescadores san nicolás                    | actividades club san nicolás                                                          |
| Noticias | noticias club de pescadores                               | capturas en el río paraná san nicolás                                                 |

El sitio no promete posiciones: la indexación es técnica (ya resuelta); el posicionamiento depende de contenido nuevo, enlaces y la ficha de Google.
