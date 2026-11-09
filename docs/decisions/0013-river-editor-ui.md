# Edición de la altura del río

Fecha: 8 de noviembre de 2026.

La sección distingue la última medición guardada de la vista previa del formulario. El resumen mantiene su altura, estación, fecha y visibilidad mientras se edita; cambia únicamente después de guardar o recargar correctamente. La altura tiene un campo destacado con unidad en metros. Los campos se agrupan por valor y momento, y por origen del dato, con ayudas, contadores y errores asociados.

La vista previa incluye altura, estación, fuente y fecha argentina. Comparte con la validación la conversión estricta de fecha local a UTC, para evitar que fechas inválidas se normalicen silenciosamente. Señala fechas futuras y mediciones de más de 24 horas sin inventar niveles de seguridad, tendencia ni datos del club. Un formulario sin altura muestra un marcador vacío, nunca una medición de cero.

La visibilidad se elige entre guardar sin publicar y mostrar en el sitio. La interfaz explica que el cambio se aplica al guardar y advierte cuando se va a retirar una medición publicada. Se conservan las confirmaciones, la protección por versión y los mensajes de error sin descartar lo ingresado. Las notas antiguas se preservan en los envíos, sin mostrarlas como un segundo espacio para condiciones del muelle.

La acción para descartar cambios restaura la última respuesta guardada, pide confirmación y devuelve el foco al campo de altura. El formulario continúa advirtiendo al cerrar o recargar una pestaña con cambios pendientes. El enlace para crear noticias del muelle confirma antes de abandonar cambios y se bloquea mientras se guarda. La navegación general del panel conserva su comportamiento existente.

El diseño apila el contenido en pantallas pequeñas, coloca publicación y vista previa en una columna lateral en pantallas amplias y conserva acciones de guardado visibles. La carga inicial tiene un estado propio y la recarga muestra progreso. No se agregan dependencias, migraciones ni permisos. Se prueban la separación entre datos guardados y editados, la fecha, el descarte, la publicación y el retiro, los errores y el bloqueo durante guardado.
