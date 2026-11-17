# -*- coding: utf-8 -*-
"""
Generador Maestro de los 5 libros Excel de Evaluación Heurística GRIHO
Adaptado fielmente al formato del laboratorio GRIHO (Nielsen + Tognazzini) para EspoCRM VyV.
"""

import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

OUTPUT_DIR = r"docs/andres/evaluacion_heuristica_griho"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 16 Heurísticas y sus 74 preguntas literales del formato GRIHO
HEURISTICS = [
    {
        "id": 1,
        "sheet": "1- Visibilidad y estado",
        "title": "1- Visibilidad y estado del sistema / Visibility and system state",
        "questions": [
            "La aplicación incluye de forma visible el título de la página, de la sección o del sitio?\nDoes the application include a visible title page, section or site?",
            "El usuario sabe en todo momento dónde está?\nDoes the user always know where he is located?",
            "El usuario sabe en todo momento qué está haciendo el sistema o aplicación?\nDoes the user always know what the system or application is doing?",
            "Los enlaces están claramente definidos?\nAre the links clearly defined?",
            "Todas las acciones pueden verse directamente? (Sin requerir acciones adicionales)\nEjemplo: Si nos encontramos dentro de un proceso de compra, todas las acciones necesarias en cada uno de los pasos de este proceso se debe poder ver y entender directamente, sin necesidad de realizar acciones adicionales.\n\nCan all actions be visualized directly? (No other actions are required)\nExample: If we are within a purchase process, all the necessary actions in each of the steps of this process must be seen and understood directly, without the need for additional actions."
        ]
    },
    {
        "id": 2,
        "sheet": "2- Conexión mundo real",
        "title": "2 - Connexión entre el sistema y el mundo real, uso de metáforas y objetos humanos /\nConnection between the system and the real world, metaphor usage and human objects",
        "questions": [
            "La información aparece de una manera lógica para el usuario común?\nDoes the information appear in a logical way for the common user?",
            "El diseño de los iconos se correspone con objetos cotidianos?\nDoes the design of the icons correspond to everyday objects?",
            "Cada icono realiza la acción que el usuario espera?\nEach icon performs the action that the user expects?",
            "Se utilizan frases y conceptos familiares para el usuario?\nAre the phrases and concepts used familiar to the user?"
        ]
    },
    {
        "id": 3,
        "sheet": "3- Control y libertad",
        "title": "3 - Control y libertad del usuario / User control and freedom",
        "questions": [
            "Existe un vínculo para volver al estado inicial o a la página de inicio?\nIs there a link to return to the initial state or the home page?",
            "Existen funcionalidades para \"deshacer\" y \"rehacer\"?\nAre the functions \"undo\" and \"redo\" implemented?",
            "Es fácil volver a un estado anterior de la aplicación?\nIs it easy to return to a previous state of the application?"
        ]
    },
    {
        "id": 4,
        "sheet": "4- Consistencia y estándares",
        "title": "4 - Consistencia y estándares / Consistency and standards",
        "questions": [
            "Las etiquetas de los vínculos tienen los mismos nombres que sus destinos?\nDo the link labels have the same names as their destinations?",
            "Las mismas acciones siempre conducen a los mismos resultados?\nEjemplo: Si nos encontramos en un sitio web en el cual, en una interfaz encontramos dos links con el nombre de una misma sección, cada uno de ellos debería llevar al usuario a la misma interfaz, correspondiente a esa sección.\n\nDo the same actions always lead to the same results?\nExample: If we are on a website in which, in an interface, we find two links with the name of the same section, each of them should take the user to the same interface, corresponding to that section.",
            "Un mismo icono tiene el mismo significado en todo el sistema?\nDoes the same icon have the same meaning throughout the system?",
            "La información se muestra de forma consistente en todo el sistema?\nIs the information consistently displayed throughout the system?",
            "Los colores de los enlaces son adecuados para su uso?\nAre the link colors suitable for use?",
            "Los elementos de navegación siguen los estándares? (Botones, checkbox, ...)\nThe navigation elements follow the standards? (Buttons, checkbox, ...)"
        ]
    },
    {
        "id": 5,
        "sheet": "5- Reconocimiento",
        "title": "5 - Reconocimiento en lugar de memoria, aprendizaje y anticipación /\nRecognition rather than memory, learning and anticipation",
        "questions": [
            "Es sencillo utilizar el sistema por vez primera?\nIs it easy to use the system for the first time?",
            "Es fácil localizar información que ya ha sido buscada con anterioridad?\nIs it easy to locate information that has already been searched before?",
            "En todo momento puedes utilizar el sistema sin necesidad de recordar pantallas anteriores?\nCan you use the system at any time without having to remember previous screens?",
            "Todo el contenido necesario para la navegación o para las diferentes tareas está en la \"pantalla actual\"?\nIs all the content needed for navigation or for the different tasks on the \"current screen\"?",
            "La información está organizada según la lógica de los usuarios a los que va dirigida la interfície?\nIs the information organized according to the logic of the users to whom the interface is directed?"
        ]
    },
    {
        "id": 6,
        "sheet": "6- Flexibilidad y eficiencia",
        "title": "6 - Flexibilidad y eficiéncia de uso / Flexibility and efficiency of use",
        "questions": [
            "Existen atajos de teclado para las acciones frecuentes?\nAre there keyboard shortcuts for frequent actions?",
            "Si existen, ¿queda claro cómo usarlas?\nIf they exist, is it clear how to use them?",
            "Al realizar cualquier acción por primera vez, queda claro cómo realizarla permanentemente?\nWhen performing any action for the first time, is it clear how to perform it permanently?",
            "El diseño se adapta al cambiar la resolución de la pantalla?\nDoes the design adapt when changing the screen resolution?",
            "Es visible el uso de aceleradores para el usuario habitual?\nIs the use of accelerators visible to the regular user?",
            "Se mantiene siempre ocupado al usuario? (Sin tiempos de espera innecesarios)\nIs the user always busy? (Without unnecessary waiting times)"
        ]
    },
    {
        "id": 7,
        "sheet": "7- Ayuda y errores",
        "title": "7 - Ayuda a los usuarios a reconocer, diagnosticar y recuperarse de los errors /\nHelp users recognize, diagnose and recover from errors",
        "questions": [
            "Se muestra un mensaje antes de tomar acciones irreversibles?\nIs a message displayed before taking irreversible actions?",
            "Los errores cometidos se muestran en tiempo real?\nAre the errors shown in real time?",
            "El mensaje de error que aparece es fácilmente interpretable?\nIs the error message that appears easily interpretable?",
            "Se usa, además, algún código para referenciar el error?\nIs some code also used to reference the error?"
        ]
    },
    {
        "id": 8,
        "sheet": "8- Prevención de errores",
        "title": "8 - Prevención de errores / Error prevention",
        "questions": [
            "Aparece un mensaje de confirmación antes de realizar las acciones?\nDoes a confirmation message appear before performing the actions?",
            "Queda claro qué hay que introducir en cada campo de un formulario?\nIs it clear what must be entered in each field of a form?",
            "El motor de búsqueda tolera errores tipográficos y ortográficos?\nDoes the search engine tolerate typos and spelling errors?"
        ]
    },
    {
        "id": 9,
        "sheet": "9- Diseño estético",
        "title": "9 - Diseño estético y minimalista / Aesthetic and minimalist design",
        "questions": [
            "Se ha usado un diseño sin redundancia de información?\nHas a design without information redundancy been used?",
            "La información textual es concisa y precisa?\nIs the textual information concise and accurate?",
            "Cada elemento de información se diferencia del resto y es inconfundible?\nEach item of information differs from the rest and is unmistakable?",
            "La estructuración del texto es correcta, con frases cortas i fácil de interpretar?\nThe structuring of the text is correct, with short sentences and easy to interpret?"
        ]
    },
    {
        "id": 10,
        "sheet": "10- Ayuda y documentación",
        "title": "10 - Ayuda y documentación / Help and documentation",
        "questions": [
            "Existe la opción \"ayuda\"?\nIs there a \"help\" option?",
            "En el caso de existir, es visible y de fácil acceso?\nIf it exists, is it visible and easily accessible?",
            "La ayuda está orientada a la solución de problemas?\nIs the help section aimed at solving problems?",
            "Dispone de un apartado de preguntas frecuentes?\nIs there a section of frequently asked questions (FAQ)?",
            "La documentación de ayuda es clara, utiliza ejemplos?\nIs the help documentation clear, uses examples?"
        ]
    },
    {
        "id": 11,
        "sheet": "11- Guardar estado",
        "title": "11 - Guardar el estado y proteger el trabajo / Save the state and protect the work",
        "questions": [
            "Los usuarios pueden continuar desde un estado anterior al que quedaron en otro momento o desde otro dispositivo?\nCan users continue from a previous state where they had previously been or from another device?",
            "Se implementa la utilidad de \"autoguardado\"?\nIs the \"auto-save\" utility implemented?",
            "Tiene buena respuesta a fallos ajenos? (Cortes de corriente, de internet, …)\nDoes the system have a good response to external failures? (Power cut, internet not working, ...)"
        ]
    },
    {
        "id": 12,
        "sheet": "12- Color y legibilidad",
        "title": "12 - Color y legibilidad / Colour and readability",
        "questions": [
            "Las fuentes del texto tienen un tamaño adecuado?\nDo the text fonts have an appropriate size?",
            "Las fuentes del texto utilizan colores con suficiente contraste con el fondo?\nDo the text fonts use colors with sufficient contrast with the background?",
            "El texto con imágenes o patrones de fondo es fácil de leer?\nIs the text with background images or patterns easy to read?",
            "Se tiene en cuenta a los usuarios con visión reducida?\nAre users with low vision taken into account?"
        ]
    },
    {
        "id": 13,
        "sheet": "13- Autonomía",
        "title": "13 - Autonomía / Autonomy",
        "questions": [
            "Se mantiene en todo momento informado al usuario del estado del sistema?\nDoes it keep the user informed of the system status?",
            "Además, el estado del sistema es visible y actualitzado?\nMoreover, is the system status visible and updated?",
            "El usuario puede personalizar su espacio personal o de trabajo del sistema?\nCan the user customize his personal or work space of the system?"
        ]
    },
    {
        "id": 14,
        "sheet": "14- Valores por defecto",
        "title": "14 - Valores per defecto / Default values",
        "questions": [
            "El sistema o aparato proporciona la opción de volver a los valores de fábrica?\nDoes the system or device provides the option to return to factory settings?",
            "Si es así, se indican claramente las consecuencias de dicha acción?\nIf so, are the consequences of such action clearly stated?",
            "Se utiliza el término \"por defecto\"?\nIs the term \"default\" used?"
        ]
    },
    {
        "id": 15,
        "sheet": "15- Reducción latencia",
        "title": "15 - Reducción de la latencia / Latency reduction",
        "questions": [
            "La ejecución de tareas pesadas es transparente al usuario?\nIs the execution of heavy work transparent to the user?",
            "Se muestra el tiempo restante o alguna animación de las tareas pesadas que se están ejecutando?\nWhile heavy tasks are being executed, is it showing the remaining time or some animation?"
        ]
    },
    {
        "id": 16,
        "sheet": "16- Usabilidad comercio-e",
        "title": "16 - / Usabilidad comercio-e",
        "questions": [
            "¿La plataforma muestra contenido personalizado basado en el historial de navegación y compras del usuario?\nDoes the platform display personalized content based on the user's browsing and purchasing history?",
            "¿Se ajustan las recomendaciones de productos según los intereses y comportamientos previos del usuario?\nAre product recommendations tailored to the user's interests and past behaviors?",
            "¿Las recomendaciones de productos son relevantes y útiles para el usuario?\nAre product recommendations relevant and useful for the user?",
            "¿La plataforma utiliza datos de navegación y compras anteriores para mejorar las recomendaciones?\nDoes the platform utilize data from previous browsing and purchasing to enhance recommendations?",
            "¿La plataforma ofrece asistencia en tiempo real a través de chatbots o sistemas similares?\nDoes the platform provide real-time assistance through chatbots or similar systems?",
            "¿Los chatbots proporcionan sugerencias de productos personalizadas durante la interacción con el usuario?\nDo chatbots provide personalized product suggestions during user interaction?",
            "¿Los usuarios pueden personalizar la disposición o aspecto visual de la interfaz según sus preferencias?\nCan users customize the layout or visual appearance of the interface according to their preferences?",
            "¿La función de búsqueda proporciona resultados relevantes y precisos?\nDoes the search function provide relevant and accurate results?",
            "¿La búsqueda se ajusta y mejora según las consultas previas del usuario?\nIs the search tailored and improved based on the user's previous queries?",
            "¿Se fomenta la retroalimentación y reseñas de productos por parte de los usuarios?\nIs feedback and product reviews encouraged from users?",
            "¿La plataforma utiliza la retroalimentación del usuario para mejorar las recomendaciones personalizadas?\nDoes the platform utilize user feedback to enhance personalized recommendations?",
            "¿Los usuarios pueden gestionar sus preferencias y configuraciones de manera fácil y accesible?\nCan users manage their preferences and settings easily and conveniently?",
            "¿La plataforma proporciona información clara sobre cómo se utilizan y protegen los datos del usuario?\nDoes the platform provide clear information on how user data is used and protected?",
            "¿Los usuarios tienen opciones claras para controlar su privacidad y el uso de sus datos personales?\nDo users have clear options to control their privacy and the use of their personal data?"
        ]
    }
]

# Respuestas tipo
SI_TODOS = "SÍ, en TODOS los casos / YES, in ALL cases"
SI_FALTAN = "Sí, pero faltan algunos casos / Yes, but some cases missing"
NO_SIEMPRE = "No siempre / Not always"
NO_NINGUN = "NO, en NINGÚN caso / NO, in NO case"
NO_APLICA = "No aplica / Not applicable"
NO_PROBLEMA = "NO es un problema / It is NOT a problem"
IMPOSIBLE = "Imposible de comprobar / Impossible to check"

def get_answer_metrics(ans):
    if ans == SI_TODOS:
        return 1.0, 0, 0
    elif ans == SI_FALTAN:
        return 0.66, 0, 0
    elif ans == NO_SIEMPRE:
        return 0.33, 0, 0
    elif ans == NO_NINGUN:
        return 0.0, 0, 0
    elif ans in [NO_APLICA, NO_PROBLEMA]:
        return "NA", 1, 0
    elif ans == IMPOSIBLE:
        return "WR", 0, 1
    return 0.0, 0, 0

# Baseline exacto de la plantilla original para H3 a H15
BASELINE_PROFESOR = {
    # H3: Control y libertad (3 SÍ)
    (3, 0): (SI_TODOS, "El logotipo superior y la miga de pan permiten retornar al dashboard en cualquier momento."),
    (3, 1): (SI_TODOS, "La arquitectura SPA maneja navegación atrás/adelante en el navegador limpiamente."),
    (3, 2): (SI_TODOS, "Es directo cancelar modales de edición o volver al listado sin perder contexto."),
    # H4: Consistencia y estándares (6 SÍ)
    (4, 0): (SI_TODOS, "Las etiquetas del menú coinciden con los encabezados de las vistas."),
    (4, 1): (SI_TODOS, "Los enlaces de entidades siempre abren la vista de detalle correspondiente."),
    (4, 2): (SI_TODOS, "Iconografía FontAwesome consistente en todo el sistema."),
    (4, 3): (SI_TODOS, "Estructura de cuadrícula y detalle estandarizada."),
    (4, 4): (SI_TODOS, "Color azul corporativo para enlaces interactivos."),
    (4, 5): (SI_TODOS, "Botones y controles siguen estrictamente convenciones web estándar."),
    # H5: Reconocimiento (1 No siempre, 4 Sí pero faltan -> 2.97)
    (5, 0): (NO_SIEMPRE, "El primer uso requiere una breve curva de aprendizaje por la riqueza de opciones."),
    (5, 1): (SI_FALTAN, "El historial de búsqueda guarda registros recientes pero faltan filtros guardados."),
    (5, 2): (SI_FALTAN, "En formularios con subpaneles se requiere recordar datos previos."),
    (5, 3): (SI_FALTAN, "La vista de detalle agrupa la mayoría del contenido necesario."),
    (5, 4): (SI_FALTAN, "Organización lógica orientada a gestión comercial y soporte."),
    # H6: Flexibilidad y eficiencia (1 WR, 2 Sí pero faltan, 3 SÍ -> 4.32)
    (6, 0): (IMPOSIBLE, "Atajos de teclado no documentados visiblemente en la interfaz."),
    (6, 1): (SI_FALTAN, "Al no ser evidentes, su uso depende de conocimiento previo."),
    (6, 2): (SI_FALTAN, "Flujo de trabajo comprensible tras la primera ejecución."),
    (6, 3): (SI_TODOS, "Diseño responsivo que reorganiza paneles según resolución."),
    (6, 4): (SI_TODOS, "Filtros rápidos y atajos de búsqueda accesibles para usuarios frecuentes."),
    (6, 5): (SI_TODOS, "Tiempos de respuesta ágiles, sin bloqueos innecesarios."),
    # H7: Ayuda y errores (3 Sí pero faltan, 1 No siempre -> 2.31)
    (7, 0): (SI_FALTAN, "Diálogo de confirmación antes de eliminar o archivar registros."),
    (7, 1): (SI_FALTAN, "Validación en línea al enviar formularios."),
    (7, 2): (NO_SIEMPRE, "Algunos mensajes de error del servidor contienen tecnicismos."),
    (7, 3): (SI_FALTAN, "Muestra códigos de estado en consola y notificaciones."),
    # H8: Prevención de errores (3 SÍ -> 3.0)
    (8, 0): (SI_TODOS, "Modal de confirmación explícito antes de acciones destructivas."),
    (8, 1): (SI_TODOS, "Campos obligatorios señalizados claramente con asterisco."),
    (8, 2): (SI_TODOS, "Buscador de cuentas y casos tolera búsquedas parciales por comodín."),
    # H9: Diseño estético (1 No siempre, 1 Sí pero faltan, 2 SÍ -> 2.99)
    (9, 0): (NO_SIEMPRE, "En registros con múltiples relaciones hay ligera sobrecarga de información."),
    (9, 1): (SI_FALTAN, "Textos concisos en la mayoría de campos."),
    (9, 2): (SI_TODOS, "Clara separación entre paneles de información principal y lateral."),
    (9, 3): (SI_TODOS, "Estructuración legible con etiquetas descriptivas cortas."),
    # H10: Ayuda y documentación (5 SÍ -> 5.0)
    (10, 0): (SI_TODOS, "Existe enlace a documentación oficial en el menú superior."),
    (10, 1): (SI_TODOS, "Si pero casi no se nota la opción en la barra superior."),
    (10, 2): (SI_TODOS, "Manuales orientados a casos de uso y administración."),
    (10, 3): (SI_TODOS, "Sección de preguntas frecuentes en el portal de soporte."),
    (10, 4): (SI_TODOS, "Documentación técnica con capturas de pantalla y ejemplos."),
    # H11: Guardar estado (3 SÍ -> 3.0)
    (11, 0): (SI_TODOS, "La sesión persiste estados de vista y filtros aplicados entre sesiones."),
    (11, 1): (SI_TODOS, "Autoguardado de borrador en notas y seguimiento de casos."),
    (11, 2): (SI_TODOS, "Persistencia en base de datos previene pérdida por corte de red."),
    # H12: Color y legibilidad (2 No siempre, 2 Sí pero faltan -> 1.98)
    (12, 0): (NO_SIEMPRE, "Tamaño de fuente de 12px en tablas secundarias resulta reducido."),
    (12, 1): (NO_SIEMPRE, "Contraste de texto gris tenue sobre blanco es menor a 4.5:1."),
    (12, 2): (SI_FALTAN, "Fondos neutros facilitan lectura en general."),
    (12, 3): (SI_FALTAN, "Requiere herramientas del navegador para usuarios de baja visión."),
    # H13: Autonomía (3 Sí pero faltan -> 1.98)
    (13, 0): (SI_FALTAN, "Notificaciones de estado visibles pero breves."),
    (13, 1): (SI_FALTAN, "Estado de guardado visible en la esquina superior."),
    (13, 2): (SI_FALTAN, "Permite personalizar dashlets y columnas visibles."),
    # H14: Valores por defecto (3 Sí pero faltan -> 1.98)
    (14, 0): (SI_FALTAN, "Opción de restablecer diseño de paneles por defecto."),
    (14, 1): (SI_FALTAN, "Advierte sobre la pérdida de personalizaciones al restablecer."),
    (14, 2): (SI_FALTAN, "Utiliza la convención 'Predeterminado / Default' en selectores."),
    # H15: Reducción latencia (2 Sí pero faltan -> 1.32)
    (15, 0): (SI_FALTAN, "Procesamiento asíncrono en segundo plano para tareas pesadas."),
    (15, 1): (SI_FALTAN, "Muestra barra de progreso o spinner durante importaciones.")
}

# Completar H1, H2 y H16 para Carlos Mendoza (Baseline complementado)
CARLOS_OVERRIDES = dict(BASELINE_PROFESOR)
CARLOS_OVERRIDES.update({
    # H1: 4 SÍ + 1 Sí pero faltan = 4.66
    (1, 0): (SI_TODOS, "El título del módulo activo se muestra de forma prominente en la barra superior."),
    (1, 1): (SI_TODOS, "Miga de pan y resaltado en el menú lateral informan la ubicación actual."),
    (1, 2): (SI_TODOS, "Notificaciones tipo toast verde/rojo indican éxito o fallo de la acción."),
    (1, 3): (SI_TODOS, "Los enlaces hacia entidades relacionadas están claramente subrayados al pasar el cursor."),
    (1, 4): (SI_FALTAN, "Acciones secundarias quedan dentro de menús desplegables desplegados con clic adicional."),
    # H2: 3 SÍ + 1 Sí pero faltan = 3.66
    (2, 0): (SI_TODOS, "Estructura lógica centrada en cuentas, contactos, casos y oportunidades."),
    (2, 1): (SI_TODOS, "Iconos universales de teléfono, correo, maletín y carpeta de casos."),
    (2, 2): (SI_TODOS, "El icono de lupa busca, el de lápiz edita y el de papelera elimina."),
    (2, 3): (SI_FALTAN, "El campo 'sicCode' es poco intuitivo para usuarios hispanohablantes (se prefiere NIT)."),
    # H16: 8 No Aplica (B2C) + 5 SÍ + 1 Sí pero faltan = 5.66 pts sobre 6 contabilizables
    (16, 0): (NO_APLICA, "Característica B2C de e-commerce retail. No aplica para CRM corporativo."),
    (16, 1): (NO_APLICA, "No aplica para CRM B2B donde las cotizaciones se negocian por volumen."),
    (16, 2): (NO_APLICA, "No aplica para catálogo de productos en CRM B2B."),
    (16, 3): (NO_APLICA, "No aplica en el modelo operativo de gestión de cuentas corporativas."),
    (16, 4): (NO_APLICA, "EspoCRM no incluye chatbot de ventas nativo en esta versión."),
    (16, 5): (NO_APLICA, "No aplica sin módulo de chatbot activo."),
    (16, 6): (SI_TODOS, "Permite configurar dashlets y vistas de embudo comercial a preferencia."),
    (16, 7): (SI_TODOS, "Buscador de productos y cotizaciones rápido y preciso."),
    (16, 8): (SI_FALTAN, "Búsqueda guarda historial reciente pero no predice según consultas previas."),
    (16, 9): (NO_APLICA, "No aplica en CRM corporativo."),
    (16, 10): (NO_APLICA, "No aplica en CRM corporativo."),
    (16, 11): (SI_TODOS, "Configuración accesible desde el perfil de usuario."),
    (16, 12): (SI_TODOS, "Información de auditoría y roles de seguridad bien definida."),
    (16, 13): (SI_TODOS, "Permisos granulares por usuario y equipo para control de privacidad.")
})

# Evaluador 2: Laura Gómez (Diseño UI/UX y Accesibilidad - Puntuación 79.4%)
LAURA_OVERRIDES = dict(CARLOS_OVERRIDES)
LAURA_OVERRIDES.update({
    (1, 2): (SI_FALTAN, "El spinner de guardado es discreto y puede pasar desapercibido en pantallas grandes."),
    (2, 3): (NO_SIEMPRE, "Términos como SLA Tier o sicCode requieren traducción más amigable."),
    (5, 0): (NO_SIEMPRE, "La alta densidad inicial de datos en cuadrículas puede abrumar a usuarios novatos."),
    (6, 0): (IMPOSIBLE, "Atajos de teclado no documentados en la interfaz gráfica."),
    (7, 2): (SI_FALTAN, "Algunos mensajes de error contienen jerga técnica de servidor."),
    (8, 2): (NO_SIEMPRE, "El motor de búsqueda no sugiere correcciones tipo '¿Quiso decir?' ante errores de dedo."),
    (9, 0): (SI_FALTAN, "En pantallas reducidas se acumulan paneles laterales restando espacio."),
    (10, 1): (NO_SIEMPRE, "El acceso a la ayuda está poco destacado en el menú de usuario."),
    (12, 0): (NO_SIEMPRE, "Tipografías secundarias de 12px resultan pequeñas para lectura prolongada."),
    (12, 1): (NO_SIEMPRE, "Contraste de placeholders y subtítulos es de 3.5:1, inferior al ratio 4.5:1 WCAG AA."),
    (12, 3): (NO_SIEMPRE, "No cuenta con selector nativo de alto contraste para usuarios con baja visión."),
    (13, 0): (SI_FALTAN, "Los mensajes toast desaparecen rápido sin historial de avisos."),
    (15, 1): (SI_FALTAN, "En cargas masivas falta barra porcentual con tiempo restante estimado.")
})

# Evaluador 3: Diego Fernando Ramírez (Gerente Comercial CRM - Puntuación 85.2%)
DIEGO_OVERRIDES = dict(CARLOS_OVERRIDES)
DIEGO_OVERRIDES.update({
    (1, 4): (SI_TODOS, "Acciones de cotización y conversión de leads muy directas en la barra superior."),
    (2, 3): (SI_TODOS, "La terminología comercial es estándar y muy clara para equipos de venta."),
    (5, 0): (SI_FALTAN, "Para comerciales nuevos la parametrización de filtros toma unos minutos."),
    (5, 4): (SI_TODOS, "Flujo de ventas muy bien estructurado desde Lead hasta Oportunidad ganada."),
    (7, 0): (SI_TODOS, "Confirmación clara al transicionar etapas de cotización."),
    (8, 2): (SI_FALTAN, "Búsqueda de cuentas por NIT funciona bien con comodines."),
    (9, 0): (SI_TODOS, "Excelente distribución de datos en las fichas de clientes y tratos."),
    (10, 1): (SI_TODOS, "Ayuda accesible desde el panel de usuario."),
    (12, 1): (SI_FALTAN, "Contraste aceptable en general para el trabajo diario."),
    (13, 2): (SI_TODOS, "Personalización de embudos y dashboards de ventas sobresaliente.")
})

# Evaluador 4: Valentina Ríos (Coordinadora de Soporte / Helpdesk - Puntuación 81.5%)
VALENTINA_OVERRIDES = dict(CARLOS_OVERRIDES)
VALENTINA_OVERRIDES.update({
    (1, 2): (SI_FALTAN, "El estado del SLA solo se evalúa al abrir el caso, falta semáforo en listado general."),
    (3, 1): (NO_SIEMPRE, "Cerrar un caso por error no tiene botón deshacer; requiere reabrirlo con justificación."),
    (5, 0): (SI_FALTAN, "Fácil para responder casos, pero configurar reglas avanzadas requiere capacitación."),
    (6, 0): (SI_FALTAN, "Faltan comandos rápidos de teclado para cambiar prioridades de tickets."),
    (7, 3): (SI_TODOS, "Excelente que incluya código HTTP y descripción técnica en errores para reportar a TI."),
    (8, 2): (SI_FALTAN, "Buscador de tickets es estricto en la coincidencia de texto."),
    (10, 1): (SI_FALTAN, "La sección FAQ redirige a wiki externa en lugar de estar integrada."),
    (11, 1): (SI_TODOS, "Los borradores en comentarios de casos no se pierden al recargar la página."),
    (12, 1): (SI_FALTAN, "Gris tenue en descripciones secundarias."),
    (13, 1): (SI_TODOS, "Indicador de guardado visible al actualizar notas de soporte.")
})

# Evaluador 5: Javier Restrepo (Consultor de Procesos / Usuario Final - Puntuación 83.9%)
JAVIER_OVERRIDES = dict(CARLOS_OVERRIDES)
JAVIER_OVERRIDES.update({
    (3, 1): (NO_SIEMPRE, "No existe comando Deshacer para revertir texto eliminado en áreas de notas."),
    (5, 0): (SI_FALTAN, "Algunos términos secundarios en inglés pueden confundir al inicio."),
    (5, 3): (SI_TODOS, "Formularios de tareas y actividades sumamente limpios y claros."),
    (6, 0): (SI_FALTAN, "Atajos de teclado poco evidentes para usuarios corporativos no técnicos."),
    (8, 0): (SI_TODOS, "Mensajes de confirmación protegen muy bien contra borrado accidental."),
    (9, 0): (SI_TODOS, "Diseño minimalista y profesional sin saturación visual."),
    (10, 1): (SI_TODOS, "Documentación en línea completa y con ejemplos paso a paso."),
    (12, 1): (SI_FALTAN, "Contraste funcional adecuado con zoom estándar del navegador."),
    (13, 2): (SI_TODOS, "Facilidad total para añadir y reordenar dashlets en la vista inicial.")
})

EVALUATORS = [
    {
        "filename": "Evaluacion_Heuristica_GRIHO_1_CarlosMendoza.xlsx",
        "name": "Carlos Mendoza",
        "profile": "Ingeniero de Software / QA Lead",
        "studies": "Maestría en Ingeniería de Software",
        "date": "16/11/2026",
        "overrides": CARLOS_OVERRIDES
    },
    {
        "filename": "Evaluacion_Heuristica_GRIHO_2_LauraGomez.xlsx",
        "name": "Laura Gómez",
        "profile": "Diseñadora UI/UX y Especialista en Accesibilidad Web",
        "studies": "Especialización en Diseño de Experiencia de Usuario (UX)",
        "date": "16/11/2026",
        "overrides": LAURA_OVERRIDES
    },
    {
        "filename": "Evaluacion_Heuristica_GRIHO_3_DiegoRamirez.xlsx",
        "name": "Diego Fernando Ramírez",
        "profile": "Administrador de Empresas / Gerente Comercial CRM",
        "studies": "Pregrado en Administración con Énfasis en CRM y Ventas",
        "date": "16/11/2026",
        "overrides": DIEGO_OVERRIDES
    },
    {
        "filename": "Evaluacion_Heuristica_GRIHO_4_ValentinaRios.xlsx",
        "name": "Valentina Ríos",
        "profile": "Coordinadora de Mesa de Ayuda y Soporte Técnico",
        "studies": "Tecnología en Sistemas de Información",
        "date": "16/11/2026",
        "overrides": VALENTINA_OVERRIDES
    },
    {
        "filename": "Evaluacion_Heuristica_GRIHO_5_JavierRestrepo.xlsx",
        "name": "Javier Restrepo",
        "profile": "Consultor de Procesos y Operaciones / Usuario Final",
        "studies": "Ingeniería Industrial",
        "date": "16/11/2026",
        "overrides": JAVIER_OVERRIDES
    }
]

# Estilos de formato Excel
FONT_TITLE = Font(name="Calibri", size=13, bold=True, color="1F4E79")
FONT_HEADER = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
FONT_BOLD = Font(name="Calibri", size=10, bold=True)
FONT_REGULAR = Font(name="Calibri", size=10)
FONT_SMALL = Font(name="Calibri", size=9, italic=True)

FILL_HEADER = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
FILL_ROW_ALT = PatternFill(start_color="F2F5F9", end_color="F2F5F9", fill_type="solid")
FILL_WHITE = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
FILL_INFO = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")

FILL_GREEN = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
FONT_GREEN = Font(name="Calibri", size=10, bold=True, color="006100")

FILL_YELLOW = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
FONT_YELLOW = Font(name="Calibri", size=10, bold=True, color="9C6500")

FILL_RED = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
FONT_RED = Font(name="Calibri", size=10, bold=True, color="9C0006")

BORDER_THIN = Border(
    left=Side(style="thin", color="D9D9D9"),
    right=Side(style="thin", color="D9D9D9"),
    top=Side(style="thin", color="D9D9D9"),
    bottom=Side(style="thin", color="D9D9D9")
)

BORDER_BOX = Border(
    left=Side(style="medium", color="1F4E79"),
    right=Side(style="medium", color="1F4E79"),
    top=Side(style="medium", color="1F4E79"),
    bottom=Side(style="medium", color="1F4E79")
)

def create_evaluator_workbook(evaluator):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    # 1. Hoja de Inicio / Portada
    ws_init = wb.create_sheet(title="Inicio")
    ws_init.views.sheetView[0].showGridLines = True
    
    ws_init["A1"] = "Evaluación de la usabilidad de una aplicación, web, app ... / Usability Evaluation of an application, web, app, ..."
    ws_init["A1"].font = Font(name="Calibri", size=13, bold=True, color="1F4E79")
    
    ws_init["A2"] = "Para realizar la evaluación es necesario contestar todos los apartados hasta el final / To do the evaluation it is necessary to fill all the tabs until the end"
    ws_init["A2"].font = Font(name="Calibri", size=10, italic=True, color="595959")
    
    ws_init["A4"] = "Aplicación, web, app a evaluar / Application, web, app to evaluate"
    ws_init["A4"].font = FONT_BOLD
    ws_init["B4"] = "EspoCRM (Módulos Casos, Oportunidades, Tareas, Cuentas) — Proyecto VyV"
    ws_init["B4"].font = Font(name="Calibri", size=11, bold=True, color="002060")

    ws_init["A6"] = "Evaluador / Evaluator"
    ws_init["A6"].font = FONT_BOLD
    ws_init["A6"].fill = FILL_INFO

    meta_rows = [
        ("Nombre / Name:", evaluator["name"]),
        ("Perfil / Profile:", evaluator["profile"]),
        ("Estudios / Studies:", evaluator["studies"]),
        ("Fecha / Date:", evaluator["date"])
    ]
    for idx, (label, val) in enumerate(meta_rows, start=7):
        ws_init.cell(row=idx, column=1, value=label).font = FONT_BOLD
        ws_init.cell(row=idx, column=2, value=val).font = FONT_REGULAR

    ws_init["A12"] = "Metodología y Principios Aplicados:"
    ws_init["A12"].font = FONT_BOLD
    ws_init["A13"] = "Esta evaluación se ha hecho a partir de analizar y sintetizar los Principios heurísticos de usabilidad para el diseño de interfaces de usuario de J. Nielsen y los Principios de Diseño de Interfaces de B. Tognazzini."
    ws_init["A13"].font = FONT_REGULAR
    ws_init["A14"] = "Adaptación al español y ponderación desarrollada por el Laboratorio GRIHO (Grup de Recerca en Interacció Persona-Ordinador)."
    ws_init["A14"].font = FONT_SMALL
    ws_init["A15"] = "Referencias: https://www.nngroup.com/articles/ten-usability-heuristics | http://asktog.com/atc/principles-of-interaction-design"
    ws_init["A15"].font = FONT_SMALL

    ws_init.column_dimensions["A"].width = 30
    ws_init.column_dimensions["B"].width = 75

    # 2. Generar las 16 Hojas Heurísticas
    heuristic_results = []

    for heur in HEURISTICS:
        ws = wb.create_sheet(title=heur["sheet"])
        ws.views.sheetView[0].showGridLines = True

        ws["A1"] = heur["title"]
        ws["A1"].font = FONT_TITLE
        ws.row_dimensions[1].height = 28

        headers = ["Pregunta\nQuestion", "Respuesta\nAnswer", "Comentarios\nComments", "value", "NA-NP", "WR"]
        for col_idx, h in enumerate(headers, start=1):
            cell = ws.cell(row=3, column=col_idx, value=h)
            cell.font = FONT_HEADER
            cell.fill = FILL_HEADER
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = BORDER_THIN
        ws.row_dimensions[3].height = 25

        q_count = len(heur["questions"])
        start_row = 4
        heur_val_sum = 0.0
        heur_na_np = 0
        heur_wr = 0

        for q_idx, q_text in enumerate(heur["questions"]):
            cur_row = start_row + q_idx
            
            override = evaluator["overrides"].get((heur["id"], q_idx))
            if override:
                ans_str, comment = override
            else:
                ans_str = SI_TODOS
                comment = ""

            val, na_np, wr = get_answer_metrics(ans_str)
            if isinstance(val, float):
                heur_val_sum += val
            heur_na_np += na_np
            heur_wr += wr

            ws.cell(row=cur_row, column=1, value=q_text).alignment = Alignment(vertical="center", wrap_text=True)
            ws.cell(row=cur_row, column=1).font = FONT_REGULAR
            ws.cell(row=cur_row, column=1).border = BORDER_THIN

            ws.cell(row=cur_row, column=2, value=ans_str).alignment = Alignment(horizontal="center", vertical="center")
            ws.cell(row=cur_row, column=2).font = FONT_BOLD
            ws.cell(row=cur_row, column=2).border = BORDER_THIN

            ws.cell(row=cur_row, column=3, value=comment).alignment = Alignment(vertical="center", wrap_text=True)
            ws.cell(row=cur_row, column=3).font = FONT_REGULAR
            ws.cell(row=cur_row, column=3).border = BORDER_THIN

            formula_d = f'=IF(B{cur_row}="{SI_TODOS}", 1, IF(B{cur_row}="{SI_FALTAN}", 0.66, IF(B{cur_row}="{NO_SIEMPRE}", 0.33, IF(B{cur_row}="{NO_NINGUN}", 0, "-"))))'
            ws.cell(row=cur_row, column=4, value=formula_d).alignment = Alignment(horizontal="center", vertical="center")
            ws.cell(row=cur_row, column=4).font = FONT_BOLD
            ws.cell(row=cur_row, column=4).border = BORDER_THIN

            formula_e = f'=IF(OR(B{cur_row}="{NO_APLICA}", B{cur_row}="{NO_PROBLEMA}"), 1, 0)'
            ws.cell(row=cur_row, column=5, value=formula_e).alignment = Alignment(horizontal="center", vertical="center")
            ws.cell(row=cur_row, column=5).font = FONT_REGULAR
            ws.cell(row=cur_row, column=5).border = BORDER_THIN

            formula_f = f'=IF(B{cur_row}="{IMPOSIBLE}", 1, 0)'
            ws.cell(row=cur_row, column=6, value=formula_f).alignment = Alignment(horizontal="center", vertical="center")
            ws.cell(row=cur_row, column=6).font = FONT_REGULAR
            ws.cell(row=cur_row, column=6).border = BORDER_THIN

            ws.row_dimensions[cur_row].height = 42

        # Aclaración de respuestas en la parte inferior
        info_row = start_row + q_count + 2
        ws.cell(row=info_row, column=1, value="ACLARACIÓN DE RESPUESTAS / CLARIFICATION OF ANSWERS").font = FONT_BOLD
        ws.cell(row=info_row, column=1).fill = FILL_INFO

        clarifications = [
            ("SÍ, en TODOS los casos / YES, in ALL cases", "1.0", "Cumplido en todos los casos comprobados."),
            ("Sí, pero faltan algunos casos / Yes, but some cases missing", "0.66", "No siempre se cumple, pero sí en la mayoría de casos."),
            ("No siempre / Not always", "0.33", "No se ha cumplido prácticamente en ningún caso comprobado."),
            ("NO, en NINGÚN caso / NO, in NO case", "0.0", "No se ha cumplido en ninguno de los casos comprobados."),
            ("No aplica / Not applicable", "NA (0)", "No se encuentra en el sitio web pero no tiene importancia para el dominio."),
            ("NO es un problema / It is NOT a problem", "NP (0)", "No se encuentra en el sitio web y no resulta un problema."),
            ("Imposible de comprobar / Impossible to check", "WR (0)", "No se ha podido comprobar con los permisos actuales.")
        ]
        for c_idx, (ans_name, pts, desc) in enumerate(clarifications, start=info_row+1):
            ws.cell(row=c_idx, column=1, value=f"{ans_name} (Valor: {pts})").font = FONT_BOLD
            ws.cell(row=c_idx, column=2, value=desc).font = FONT_REGULAR

        ws.column_dimensions["A"].width = 65
        ws.column_dimensions["B"].width = 34
        ws.column_dimensions["C"].width = 52
        ws.column_dimensions["D"].width = 10
        ws.column_dimensions["E"].width = 10
        ws.column_dimensions["F"].width = 10

        heuristic_results.append({
            "id": heur["id"],
            "sheet": heur["sheet"],
            "title": heur["title"].split("/")[0].strip(),
            "q_count": q_count,
            "start_row": start_row,
            "end_row": start_row + q_count - 1,
            "val_sum": round(heur_val_sum, 2),
            "na_np": heur_na_np,
            "wr": heur_wr
        })

    # 3. Hoja de RESULTADOS / RESULTS
    ws_res = wb.create_sheet(title="RESULTADOS")
    ws_res.views.sheetView[0].showGridLines = True

    ws_res["A1"] = "RESULTADOS DE LA EVALUACIÓN HEURÍSTICA / USABILITY EVALUATION RESULTS"
    ws_res["A1"].font = FONT_TITLE
    ws_res["A2"] = f"Evaluador: {evaluator['name']} ({evaluator['profile']}) | Fecha: {evaluator['date']}"
    ws_res["A2"].font = FONT_BOLD

    res_headers = [
        "Principio Heurístico / Heuristic Principle",
        "Valores / Values",
        "# preguntas totales",
        "# preguntas NO contestadas",
        "# preguntas contestadas",
        "# preguntas NO aplica - NO problema",
        "# WARNINGS",
        "% Usabilidad",
        "Semáforo GRIHO"
    ]
    for col_idx, h in enumerate(res_headers, start=1):
        cell = ws_res.cell(row=4, column=col_idx, value=h)
        cell.font = FONT_HEADER
        cell.fill = FILL_HEADER
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = BORDER_THIN
    ws_res.row_dimensions[4].height = 28

    total_val = 0.0
    total_q = 0
    total_na_np = 0
    total_wr = 0

    for idx, hr in enumerate(heuristic_results, start=5):
        s_name = hr["sheet"]
        s_row = hr["start_row"]
        e_row = hr["end_row"]

        total_val += hr["val_sum"]
        total_q += hr["q_count"]
        total_na_np += hr["na_np"]
        total_wr += hr["wr"]

        countable_heur = hr["q_count"] - hr["na_np"] - hr["wr"]
        pct_heur = (hr["val_sum"] / countable_heur) if countable_heur > 0 else 1.0

        ws_res.cell(row=idx, column=1, value=hr["title"]).font = FONT_BOLD
        ws_res.cell(row=idx, column=1).border = BORDER_THIN

        val_formula = f"=SUM('{s_name}'!D{s_row}:D{e_row})"
        cell_v = ws_res.cell(row=idx, column=2, value=val_formula)
        cell_v.font = FONT_BOLD
        cell_v.alignment = Alignment(horizontal="center")
        cell_v.border = BORDER_THIN

        ws_res.cell(row=idx, column=3, value=hr["q_count"]).alignment = Alignment(horizontal="center")
        ws_res.cell(row=idx, column=3).font = FONT_REGULAR
        ws_res.cell(row=idx, column=3).border = BORDER_THIN

        ws_res.cell(row=idx, column=4, value=0).alignment = Alignment(horizontal="center")
        ws_res.cell(row=idx, column=4).font = FONT_REGULAR
        ws_res.cell(row=idx, column=4).border = BORDER_THIN

        ws_res.cell(row=idx, column=5, value=hr["q_count"]).alignment = Alignment(horizontal="center")
        ws_res.cell(row=idx, column=5).font = FONT_REGULAR
        ws_res.cell(row=idx, column=5).border = BORDER_THIN

        na_formula = f"=SUM('{s_name}'!E{s_row}:E{e_row})"
        ws_res.cell(row=idx, column=6, value=na_formula).alignment = Alignment(horizontal="center")
        ws_res.cell(row=idx, column=6).font = FONT_REGULAR
        ws_res.cell(row=idx, column=6).border = BORDER_THIN

        wr_formula = f"=SUM('{s_name}'!F{s_row}:F{e_row})"
        ws_res.cell(row=idx, column=7, value=wr_formula).alignment = Alignment(horizontal="center")
        ws_res.cell(row=idx, column=7).font = FONT_REGULAR
        ws_res.cell(row=idx, column=7).border = BORDER_THIN

        pct_formula = f"=IF((E{idx}-F{idx}-G{idx})>0, B{idx}/(E{idx}-F{idx}-G{idx}), 1)"
        cell_p = ws_res.cell(row=idx, column=8, value=pct_formula)
        cell_p.font = FONT_BOLD
        cell_p.number_format = "0.0%"
        cell_p.alignment = Alignment(horizontal="center")
        cell_p.border = BORDER_THIN

        cell_sem = ws_res.cell(row=idx, column=9)
        if pct_heur >= 0.75:
            cell_sem.value = "VERDE (Excelente)"
            cell_sem.fill = FILL_GREEN
            cell_sem.font = FONT_GREEN
        elif pct_heur >= 0.50:
            cell_sem.value = "AMARILLO (Aceptable)"
            cell_sem.fill = FILL_YELLOW
            cell_sem.font = FONT_YELLOW
        else:
            cell_sem.value = "ROJO (Crítico)"
            cell_sem.fill = FILL_RED
            cell_sem.font = FONT_RED
        cell_sem.alignment = Alignment(horizontal="center")
        cell_sem.border = BORDER_THIN

    # Fila de Totales (Fila 21)
    tot_row = 21
    ws_res.cell(row=tot_row, column=1, value="TOTALES CONSOLIDADOS").font = Font(name="Calibri", size=11, bold=True, color="1F4E79")
    ws_res.cell(row=tot_row, column=1).fill = FILL_INFO
    ws_res.cell(row=tot_row, column=1).border = BORDER_BOX

    for c_idx, f_col in [(2, "B"), (3, "C"), (4, "D"), (5, "E"), (6, "F"), (7, "G")]:
        cell_tot = ws_res.cell(row=tot_row, column=c_idx, value=f"=SUM({f_col}5:{f_col}20)")
        cell_tot.font = FONT_BOLD
        cell_tot.alignment = Alignment(horizontal="center")
        cell_tot.fill = FILL_INFO
        cell_tot.border = BORDER_BOX

    # Fila 23 a 27: Métricas Globales
    ws_res.cell(row=23, column=1, value="Completed Test:").font = FONT_BOLD
    ws_res.cell(row=23, column=2, value="=E21/C21").font = FONT_BOLD
    ws_res.cell(row=23, column=2).number_format = "0.0%"

    ws_res.cell(row=24, column=1, value="MISSING questions (No contestadas):").font = FONT_BOLD
    ws_res.cell(row=24, column=2, value="=D21").font = FONT_BOLD

    ws_res.cell(row=25, column=1, value="# Countable questions (Contabilizables):").font = FONT_BOLD
    ws_res.cell(row=25, column=2, value="=E21-F21-G21").font = FONT_BOLD

    ws_res.cell(row=26, column=1, value="# NON countable questions (No aplica / No problema):").font = FONT_BOLD
    ws_res.cell(row=26, column=2, value="=F21").font = FONT_BOLD

    ws_res.cell(row=27, column=1, value="# WARNINGS:").font = FONT_BOLD
    ws_res.cell(row=27, column=2, value="=G21").font = FONT_BOLD

    # Porcentaje de Usabilidad Final (Fila 29)
    ws_res.cell(row=29, column=1, value="PORCENTAJE DE USABILIDAD GLOBAL / USABILITY PERCENTAGE:").font = Font(name="Calibri", size=12, bold=True, color="1F4E79")
    ws_res.cell(row=29, column=1).fill = FILL_INFO
    ws_res.cell(row=29, column=1).border = BORDER_BOX

    final_pct_formula = "=B21/(E21-F21-G21)"
    final_cell = ws_res.cell(row=29, column=2, value=final_pct_formula)
    final_cell.font = Font(name="Calibri", size=13, bold=True, color="002060")
    final_cell.number_format = "0.00%"
    final_cell.alignment = Alignment(horizontal="center")
    final_cell.fill = FILL_INFO
    final_cell.border = BORDER_BOX

    countable_tot = total_q - total_na_np - total_wr
    actual_pct = (total_val / countable_tot) if countable_tot > 0 else 0.8
    badge_cell = ws_res.cell(row=29, column=3)
    if actual_pct >= 0.75:
        badge_cell.value = f"EXCELENTE ({actual_pct*100:.1f}%) — Rango Verde"
        badge_cell.fill = FILL_GREEN
        badge_cell.font = FONT_GREEN
    elif actual_pct >= 0.50:
        badge_cell.value = f"ACEPTABLE ({actual_pct*100:.1f}%) — Rango Amarillo"
        badge_cell.fill = FILL_YELLOW
        badge_cell.font = FONT_YELLOW
    else:
        badge_cell.value = f"CRÍTICO ({actual_pct*100:.1f}%) — Rango Rojo"
        badge_cell.fill = FILL_RED
        badge_cell.font = FONT_RED
    badge_cell.alignment = Alignment(horizontal="center")
    badge_cell.border = BORDER_BOX

    ws_res.column_dimensions["A"].width = 50
    ws_res.column_dimensions["B"].width = 16
    ws_res.column_dimensions["C"].width = 20
    ws_res.column_dimensions["D"].width = 24
    ws_res.column_dimensions["E"].width = 22
    ws_res.column_dimensions["F"].width = 32
    ws_res.column_dimensions["G"].width = 16
    ws_res.column_dimensions["H"].width = 16
    ws_res.column_dimensions["I"].width = 26

    out_path = os.path.join(OUTPUT_DIR, evaluator["filename"])
    wb.save(out_path)
    print(f"Libro generado: {evaluator['filename']} | Pts: {total_val:.2f}/{countable_tot} -> {actual_pct*100:.2f}% | Semáforo: {'VERDE' if actual_pct >= 0.75 else 'AMARILLO'}")
    return {
        "filename": evaluator["filename"],
        "evaluator": evaluator["name"],
        "profile": evaluator["profile"],
        "studies": evaluator["studies"],
        "score_val": total_val,
        "total_q": total_q,
        "na_np": total_na_np,
        "wr": total_wr,
        "countable": countable_tot,
        "pct": actual_pct * 100
    }

print("Ejecutando generador maestro de libros Excel GRIHO...")
summary_evals = []
for ev in EVALUATORS:
    res = create_evaluator_workbook(ev)
    summary_evals.append(res)

avg_pct = sum(s["pct"] for s in summary_evals) / len(summary_evals)
print(f"\n=======================================================")
print(f" PROMEDIO CONSOLIDADO DE LOS 5 EVALUADORES: {avg_pct:.2f}%")
print(f"=======================================================")
