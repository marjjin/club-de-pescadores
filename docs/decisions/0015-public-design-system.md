# 0015 — Sistema visual del sitio público

## Contexto

El sitio público usaba la identidad del club (Anton, Allura, amarillo de la
fachada) solo en el hero. El resto de las secciones repetía un mismo esquema
genérico, con radios, sombras y estados de carga, vacío y error inconsistentes.
El foco visible amarillo tenía un contraste de 1,6:1 sobre blanco y no cumplía
WCAG 1.4.11.

## Decisión

- **Concepto "muelle al atardecer"**: navy (río), amarillo `sun-400` (fachada) y
  el celeste `mist` como fondo alternativo, que se conserva por pedido del club.
- **Títulos** de sección y de página en Anton en mayúsculas, precedidos por una
  barra amarilla corta, el único motivo gráfico del sitio. Allura queda
  reservada para el wordmark del hero.
- **Escalas**: radios `rounded-lg` (controles), `rounded-2xl` (tarjetas) y
  `rounded-full` (chips). Sombras `shadow-card` y `shadow-raised`.
- **Primitivas en `src/shared/ui/`**: `buttonClass` (primary, secondary,
  outline, outlineOnDark, en tamaños md/sm), `textLink`, `layout`
  (`container`, `section`), `SectionHeading`, `PageHeader`, `StatusMessage`,
  `Skeleton` y `PagerNav`.
- **Foco**: anillo doble, con navy adentro y amarillo afuera. Se ve sobre los
  fondos blanco, celeste, navy y amarillo.
- **Ritmo de la home**: hero oscuro → bandas blancas y celestes → "Sumate" en
  amarillo → footer navy. Hay un único llamado a WhatsApp por pantalla, además
  del botón flotante.

## Alcance

Solo el sitio público. El panel admin conserva sus estilos de
`features/admin/components/ui.tsx` y queda pendiente de migrar a estas
primitivas.

## Consecuencias

- El JS inicial de la home pasó de 196,5 a 199,3 KB gzip, contra un presupuesto
  de 200 KB. Cualquier agregado al bundle inicial obliga a recortar antes.
- Las primitivas nuevas no tienen lógica de negocio. Los datos siguen fluyendo
  por los hooks de cada feature.
