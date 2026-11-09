# Configuración de la cuenta administrativa

Fecha: 8 de noviembre de 2026.

La pantalla de Mi cuenta reúne la identidad actual, accesos directos a cada sección y formularios separados de correo y contraseña. En pantallas amplias, la seguridad de la sesión ocupa una columna lateral; en móviles, el contenido se apila. Los textos largos pueden partirse sin ampliar la página.

Los campos tienen ayudas y errores asociados, foco en el primer error y acciones para descartar cambios. Mientras se envían solicitudes se deshabilitan los controles y se evitan envíos repetidos. Un formulario con cambios pendientes advierte al cerrar o recargar la pestaña; esto no bloquea la navegación interna del panel.

El correo nuevo se valida, se compara con el actual y requiere confirmación coincidente. La respuesta del servicio muestra una solicitud pendiente de confirmación: la interfaz conserva el correo actual y no permite reenviar ese mismo formulario tras el éxito. La confirmación real sigue a cargo de Supabase Auth.

Las contraseñas conservan el requisito existente de 12 a 128 caracteres, sin eliminar espacios ni inventar criterios de fortaleza. Cada campo puede mostrarse u ocultarse de manera independiente. Tras un guardado confirmado se vacían y ocultan ambos campos y se mantiene el callback usado por la activación y recuperación de cuentas. No se guardan credenciales en almacenamiento del navegador.

La sección de seguridad se muestra dentro del panel protegido por MFA. El cierre de otras sesiones conserva la confirmación y la llamada existente con alcance `others`; aclara que esta sesión sigue abierta y que los accesos anteriores pueden demorar en vencer. No presenta un inventario ficticio de dispositivos ni agrega mecanismos de recuperación del autenticador.

No cambian las políticas de autorización, la API de autenticación ni el esquema SQL. No se agregan dependencias. Las pruebas verifican validación, foco, confirmación de correo pendiente, visibilidad y limpieza de contraseñas, solicitudes duplicadas y el alcance del cierre de sesiones.

Referencias: [cambio de usuario en Supabase Auth](https://supabase.com/docs/reference/javascript/auth-updateuser) y [cierre de sesiones](https://supabase.com/docs/reference/javascript/auth-signout).
