# 0021 — Modales compartidos

## Contexto

Había cuatro implementaciones de `<dialog>` (confirmación, herramientas de
torneos, vista previa de noticias y visor de fotos), cada una con sus clases,
sin animación y centradas también en el celular. El visor de fotos bloqueaba el
scroll con `overflow: hidden` en `<html>`, que quita la barra de scroll, mueve
el layout y rompe los elementos `sticky`.

## Decisión

- **`useModalDialog`** (`src/shared/hooks/`) maneja un `<dialog>` nativo desde
  React: `showModal()`, `closedby="any"` con respaldo por puntero para Safari, y
  cierre animado. Todo pedido de cierre (Esc, gesto atrás, clic afuera, botones)
  marca `data-closing`, espera la transición y recién entonces llama a
  `close()`. Así la salida se anima en todos los navegadores, no solo en los que
  soportan `overlay` y transiciones discretas de `display`.
- El foco inicial se marca con `data-autofocus`: React convierte `autoFocus` en
  un `focus()` al montar, cuando el diálogo puede estar cerrado.
- **`Modal`** (`src/shared/ui/`): ventana centrada desde 640 px y hoja inferior
  en el celular, con encabezado fijo (título, descripción, ícono, cerrar) y
  barra de acciones opcional. La usan `ConfirmProvider`, `TournamentDialog` y
  `NewsPreviewDialog`.
- **`Lightbox`** (`src/shared/ui/`): visor a pantalla completa sobre fondo
  opaco, con deslizamiento táctil (y deslizar hacia abajo para cerrar), flechas
  de teclado, contador y epígrafe. Lo usan `MediaGallery` y `NewsArticleImage`.
- El scroll de fondo se contiene con `overscroll-behavior` en el diálogo y en
  `::backdrop`, nunca tocando `<html>` o `<body>`.
- Los estilos viven en `@layer components` de `index.css` (`.modal`,
  `.lightbox`), así las utilidades de Tailwind siguen pudiendo pisarlos.

## Consecuencias

- En Safari, `overscroll-behavior` sobre contenedores sin desborde todavía no se
  respeta: si el contenido del modal no desborda, la página de fondo puede
  desplazarse. Es mejora progresiva; el modal igual deja la página inerte.
- Un modal nuevo debe usar `Modal` o `useModalDialog`, no un `<dialog>` suelto.
