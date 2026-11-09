# Noticias completas con dirección propia

Las tarjetas de inicio y del archivo muestran un resumen de hasta 160 caracteres, con un máximo visual de tres líneas, y un enlace «Leer noticia». La noticia completa está en `/noticias/:id`, con una imagen ampliada, fecha y texto que conserva sus saltos de párrafo. La URL se puede compartir y abrir directamente.

Se conserva `news.excerpt` como texto completo existente, sin migraciones ni duplicación de contenido. El resumen se deriva solo para la presentación; nunca se recorta el dato guardado. La vista previa del editor utiliza el mismo resumen en su tarjeta.

La consulta individual valida el UUID, pide como máximo una fila por clave primaria y aplica los mismos filtros públicos que el listado: publicada, sin archivar y con fecha de publicación alcanzada. Las políticas RLS existentes siguen siendo la autorización efectiva. Un enlace inválido o una publicación no disponible muestran un mensaje de recuperación; los errores de red permiten reintentar. La consulta se cancela al cambiar de ruta y su caché se identifica por UUID.

Pruebas: resumen con límites y Unicode, consulta individual con filtros y validación, navegación tarjeta → noticia → archivo, acceso directo, contenido no disponible y reintento tras error. No requiere aplicar SQL ni cambiar variables de entorno.
