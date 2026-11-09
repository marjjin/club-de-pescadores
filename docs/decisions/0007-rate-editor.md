# Editor de tarifas de pileta

El formulario de tarifas usa un editor específico dentro de la funcionalidad administrativa, con secciones de datos, precios y condiciones, y vigencia. La columna lateral reúne las opciones de publicación y una vista previa local que no guarda ni publica información. En pantallas pequeñas las secciones se apilan; los textos largos ajustan su ancho y las acciones de guardado permanecen disponibles al desplazarse.

Los importes se ingresan en pesos sin separadores de miles, con coma o punto decimal, y se convierten a centavos enteros antes de validar con el esquema existente. Se conservan los límites de PostgreSQL, el valor cero y las fechas opcionales. La vigencia inicial de una tarifa nueva propone el día actual en Argentina. El editor muestra errores junto a cada campo, enfoca el primero inválido, protege cambios sin guardar y bloquea controles durante el guardado. Publicar, modificar una tarifa publicada o retirarla requiere confirmación.

La consulta pública ahora también filtra `valid_from <= hoy`, además de descartar tarifas vencidas, archivadas y sin publicar. Se respeta el rango inclusivo de vigencia; las tarifas futuras publicadas se muestran cuando comienza su vigencia. Esto es un filtro de presentación; no modifica las políticas RLS ni convierte tarifas publicadas futuras en datos privados.

Se mantienen las RPC, permisos, auditoría y control de versión existentes. No requiere dependencias nuevas ni migraciones. Se prueban conversión exacta, límites, fechas, vista previa, foco de validación, confirmación de publicación y retiro, edición con versión, protección al salir y recuperación de errores.
