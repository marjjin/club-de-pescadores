# Historial de actividad legible

La auditoría se presenta por fecha de Argentina, con responsable, hora de 24 horas, sección, título del registro y una etiqueta de operación. Las etiquetas de archivo, restauración, publicación, programación, activación y asignación se derivan de los valores guardados; la operación original continúa disponible en las referencias. Las operaciones de una misma solicitud se mantienen separadas, sin inventar eventos agrupados ni conteos globales.

«Ver detalle» reemplaza el JSON por campos con nombres legibles. Los precios se convierten de centavos a pesos, la altura de centímetros a metros y los estados booleanos se expresan con nombres. Los valores nulos reciben una descripción según el campo; cero, falso y texto vacío se conservan como valores distintos. Las fechas de calendario no cambian de día y los instantes se muestran en la zona horaria del club.

Una creación muestra los datos creados y una eliminación muestra los datos eliminados. Las actualizaciones comparan solo campos modificados, con columnas «Antes» y «Después» que se apilan en pantallas pequeñas. Los identificadores y cambios de marcas temporales quedan en un desplegable de referencias. Cuando una asignación solo contiene UUID, se mantienen como identificadores sin inventar nombres de usuarios o roles que no están en el registro.

La comparación es estructural y no depende del orden de las claves JSON. Los datos históricos se tratan como valores no confiables: se renderizan como texto, sin HTML, y las imágenes se ofrecen como enlaces HTTPS que se abren únicamente por decisión del usuario. No se cargan imágenes externas automáticamente ni se muestran bloques de JSON crudo.

El filtro de sección se aplica en el servidor al cambiar la selección. Se conserva la consulta por cursor, el límite de veinte filas visibles y el aislamiento de caché por administrador. Los estados de carga, vacío, error y actualización se diferencian; la paginación aparece cuando corresponde. No cambia el esquema ni los permisos: la auditoría sigue siendo de solo lectura y no requiere migraciones nuevas.

Las pruebas verifican formatos, diferencias, referencias, fechas, operaciones, filtros, paginación, valores históricos y renderizado seguro. La revisión visual en navegador se registra por separado de las pruebas DOM y el build.
