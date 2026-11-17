"""
Respuestas de la evaluación heurística (plantilla Granollers v2021, 15 principios / 60 preguntas) para las pantallas
del módulo Moneda y tasas de cambio (CUR) de EspoCRM 10.1.1.

Evaluador: Alejandro Bustamante, con asistencia de IA (Claude). Cada respuesta cita su evidencia: pruebas ya
ejecutadas en el proyecto (docs/CUR/...) o datos recogidos de la interfaz el 16-11-2026 (docs/CUR/usabilidad/datos).
El orden coincide con el de las preguntas en la plantilla (hoja por hoja, de arriba abajo).
"""

S = "SÍ, en TODOS los casos / YES, in ALL cases"
P = "Sí, pero faltan algunos casos / Yes, but some cases missing"
A = "No siempre / Not always"
N = "NO, en NINGÚN caso / NO, in NO case"
NA = "No aplica / Not applicable"
NP = "NO es un problema / It is NOT a problem"
WR = "Imposible de comprobar / Impossible to check"

EVALUADOR = {
    "aplicacion": "EspoCRM 10.1.1 — módulo Moneda y tasas de cambio (CUR): Formula Sandbox (conversión), formulario de "
                  "Campaign (presupuesto con moneda), Currencies › COP › Rates (tasas) y Administration › Currency.",
    "nombre": "Alejandro Bustamante, con asistencia de IA (Claude)",
    "perfil": "Estudiante de Validación y Verificación de Software; responsable de las pruebas del módulo CUR",
    "estudios": "(completar)",
    "fecha": "16/11/2026",
}

RESPUESTAS = [
    # 1 — Visibilidad y estado del sistema
    (S, "Todas las pantallas muestran título y ruta: «Administration › Formula Sandbox», «Currencies › COP», «Campaigns › create» (datos/*.json)."),
    (P, "La ruta (breadcrumb) indica la sección, pero Formula Sandbox y Currency cuelgan de Administration sin pestaña activa en la barra superior."),
    (P, "Hay avisos «Loading…», «Saved», «Created». Pero un error de la fórmula solo dice «Internal server error – Check logs» (DEF-CUR-01) y no explica qué pasó."),
    (A, "axe: 12 enlaces de la barra de navegación sin texto (link-name) y el enlace del breadcrumb se distingue solo por color (link-in-text-block). docs/CUR/accesibilidad."),
    (P, "Guardar y Run están a la vista, pero acciones como Remove o Edit de una tasa quedan dentro de menús «…»; el formulario de Campaign tiene 14 botones de solo ícono."),
    # 2 — Conexión con el mundo real
    (P, "Los campos se agrupan con lógica, pero la tasa se expresa como «1 COP = 0.000250 USD» y convertir exige escribir una fórmula ext\\currency\\convert."),
    (P, "Ícono de calendario para fechas, «+» para crear, «…» para más acciones: cotidianos. Varios botones de solo ícono no tienen texto que los explique."),
    (S, "Los íconos probados (calendario, crear, menú, cerrar) hacen lo que se espera (pruebas Cypress y Playwright MCP)."),
    (A, "Términos técnicos para un usuario de finanzas: «Formula Sandbox», «Target Type», «Internal server error – Check logs for details»."),
    # 3 — Control y libertad del usuario
    (S, "El logo y la pestaña Home llevan siempre a la página de inicio."),
    (N, "No hay deshacer ni rehacer: una tasa borrada o editada no se puede revertir desde la interfaz; solo existe Cancel antes de guardar."),
    (P, "El botón Atrás del navegador y Cancel funcionan; el historial (audit) de la tasa permite ver valores anteriores, pero no restaurarlos."),
    # 4 — Consistencia y estándares
    (S, "«Currencies», «Campaigns» y «Administration» llevan a la sección con el mismo nombre."),
    (P, "En la pantalla sí. Entre canales no: la pantalla corta el monto a 13 dígitos y la API acepta 14 (OBS-CUR-04); «12abc» se borra sin aviso (OBS-CUR-05)."),
    (S, "El mismo ícono mantiene su significado en todas las pantallas revisadas."),
    (A, "COP y USD se muestran con el mismo símbolo «$» (OBS-CUR-01); el Sandbox muestra 14 decimales y el detalle 2."),
    (A, "Las etiquetas usan gris #969696 sobre blanco (2.95:1) y el enlace del breadcrumb solo se distingue por color (axe)."),
    (P, "Barra superior, breadcrumb y menús siguen los patrones de Bootstrap, pero hay enlaces y botones sin nombre accesible (axe, Playwright MCP)."),
    # 5 — Reconocimiento antes que memoria
    (A, "Convertir montos requiere conocer la sintaxis de fórmulas en Administration; administrar tasas está en Administration › Currency › Currencies."),
    (P, "Las listas recuerdan el último filtro y orden; no hay historial de búsquedas recientes."),
    (P, "Para convertir en el Sandbox hay que recordar los códigos de moneda y la tasa vigente, que se ven en otra pantalla."),
    (P, "El detalle de COP muestra la tasa vigente y el panel Rates; el Sandbox no muestra las monedas ni las tasas disponibles."),
    (P, "La organización sigue la lógica del administrador del CRM, no la de un usuario de ventas o finanzas que solo quiere convertir."),
    # 6 — Flexibilidad y eficiencia
    (S, "Existen atajos: Ctrl+Enter (guardar / Run), Ctrl+S y Ctrl+Alt+Enter (datos/campaign-create.json)."),
    (A, "Solo se descubren al pasar el mouse sobre el botón (atributo title); no hay una lista visible de atajos."),
    (P, "Las acciones repetidas siguen el mismo camino, pero nada indica cómo automatizar una conversión fuera del Sandbox."),
    (S, "A 320 px de ancho el formulario no necesita desplazamiento horizontal (CP-A11Y-CUR-13)."),
    (A, "Los atajos no se muestran en la interfaz para el usuario habitual, solo en el tooltip de los botones."),
    (NP, "Las operaciones de CUR responden en menos de un segundo; no hay esperas que requieran entretener al usuario."),
    # 7 — Reconocer, diagnosticar y recuperarse de errores
    (S, "Antes de borrar se pide confirmación: «Are you sure you want to remove the record?» (datos/confirmacion-borrar.json)."),
    (P, "La validación de la tasa aparece al guardar, no al escribir; las letras en el monto se borran en silencio en lugar de marcar error (OBS-CUR-05)."),
    (A, "«Rate shouldn't be less than 0.0001» es claro, pero los errores de la fórmula solo dicen «Internal server error – Check logs for details» (DEF-CUR-01/02)."),
    (A, "Solo los errores del servidor muestran un código HTTP (500); los mensajes de validación no tienen código de referencia."),
    # 8 — Prevención de errores
    (P, "Se confirma el borrado, pero no el cambio de la tasa vigente, que afecta de inmediato a todas las conversiones."),
    (A, "Los obligatorios llevan asterisco, pero el campo Rate no indica el sentido de la tasa ni el mínimo 0.0001 hasta que falla; Budget no indica el formato."),
    (N, "La búsqueda no tolera errores: «USD» encuentra 1 moneda y «UDS» encuentra 0 (prueba por API, 16-11-2026)."),
    # 9 — Diseño estético y minimalista
    (P, "En el detalle de COP la tasa vigente aparece en el registro y otra vez en el panel Rates."),
    (S, "Etiquetas y mensajes cortos y precisos («Rate», «Date», «Base Currency»)."),
    (A, "Los montos en COP y en USD usan el mismo símbolo «$», así que no se distinguen a simple vista (OBS-CUR-01)."),
    (S, "Textos breves y fáciles de leer en todas las pantallas revisadas."),
    # 10 — Ayuda y documentación
    (P, "Hay íconos de información en algunos campos (4 en Campaign y Admin › Currency, 2 en el Sandbox), pero ningún enlace de ayuda (datos/*.json)."),
    (A, "Los íconos son pequeños y solo están en algunos campos; el detalle de COP y el campo Rate no tienen ninguno."),
    (N, "Los textos de ayuda describen el campo; no orientan a resolver problemas como un error de conversión."),
    (N, "No hay preguntas frecuentes en la aplicación."),
    (A, "No hay ejemplos dentro de la aplicación de cómo usar ext\\currency\\convert; la documentación está solo fuera (docs.espocrm.com)."),
    # 11 — Guardar el estado y proteger el trabajo
    (P, "Los datos guardados están en el servidor y se ven desde cualquier dispositivo; un formulario sin guardar se pierde."),
    (N, "No hay autoguardado: al salir de un formulario con cambios solo aparece el aviso de «salir sin guardar»."),
    (WR, "No se probaron cortes de red o de energía durante una operación."),
    # 12 — Color y legibilidad
    (S, "Texto de 14 px en etiquetas y campos (axe, contraste-etiqueta-budget.json)."),
    (A, "Etiquetas con contraste 2.95:1, por debajo del mínimo 4.5:1 de WCAG 1.4.3 (CP-A11Y-CUR-10)."),
    (NA, "Las pantallas de CUR no usan imágenes ni patrones de fondo detrás del texto."),
    (A, "El reflujo a 320 px funciona, pero el zoom está bloqueado en móviles (user-scalable=no) y el contraste es bajo (A11Y-CUR-03 y 06)."),
    # 13 — Autonomía
    (P, "Hay avisos de carga y de guardado; los errores internos de la fórmula no informan bien del estado (DEF-CUR-01)."),
    (P, "Al guardar una tasa la configuración se actualiza al instante (hooks, CUR-F5); otras pestañas abiertas no se refrescan hasta recargar."),
    (S, "Cada usuario configura Preferences (tema, panel de inicio, idioma, formato de números)."),
    # 14 — Valores por defecto
    (N, "No existe la opción de restaurar la configuración de monedas a sus valores iniciales."),
    (NA, "Al no existir la opción de restaurar, no hay consecuencias que indicar."),
    (S, "Se usa «Default Currency» en Administration › Currency."),
    # 15 — Reducción de la latencia
    (NP, "En CUR no hay tareas pesadas: conversiones y guardado de tasas responden en menos de un segundo."),
    (P, "Se muestra «Loading…» / «Saving…», pero no hay barra de progreso ni tiempo restante (no hace falta por la rapidez)."),
]

assert len(RESPUESTAS) == 60, len(RESPUESTAS)
