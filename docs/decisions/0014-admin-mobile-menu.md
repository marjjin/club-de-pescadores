# Navegación móvil del panel

Fecha: 9 de noviembre de 2026.

Por debajo de 64 rem, la navegación del administrador se abre desde un botón hamburguesa en el encabezado. Reemplaza la lista de secciones que ocupaba la parte superior de la pantalla. En escritorio se conserva la barra lateral y ambas variantes comparten el mismo catálogo de enlaces y estado activo.

El menú móvil utiliza un diálogo modal nativo, con fondo oscurecido, foco inicial en la cruz y bloqueo del desplazamiento de la página. El navegador mantiene el foco dentro del diálogo y vuelve inerte el contenido de fondo. La lista del menú puede desplazarse independientemente en pantallas de poca altura.

La cruz, Escape y el fondo cierran el menú y devuelven el foco al botón. Elegir una sección cierra el diálogo y lleva el foco al contenido, incluso cuando la sección ya estaba activa. Cambiar de ruta, pasar a escritorio o desmontar el panel restaura el desplazamiento. El botón declara su estado expandido y el diálogo que controla.

No cambian permisos, sesiones, rutas ni consultas de Supabase. No se agregan dependencias ni migraciones. Las pruebas verifican apertura, foco inicial y restauración, cierre, selección, cambios de ruta y limpieza al cambiar de tamaño o desmontar. El comportamiento nativo del foco modal y la apariencia requieren revisión en un navegador real; jsdom no implementa esas capacidades.
