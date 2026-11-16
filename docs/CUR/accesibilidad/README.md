# CUR — Pruebas de accesibilidad (WCAG 2.1 nivel AA)

**Criterio de la rúbrica:** 11 (Accesibilidad). **Fecha:** 16 de noviembre de 2026.
**Pantallas evaluadas:**
- Formula Sandbox (CUR-F1 y F2).
- Formulario de Campaign (CUR-F3).
- Lista de monedas, detalle de COP con el panel Rates, modal de nueva tasa y Administration › Currency (CUR-F5).

CUR-F4 es una funcionalidad de API sin pantalla.

**Resultado:** 19 pruebas, las 19 pasan ([`ejecucion.txt`](ejecucion.txt)). Hay 6 comprobaciones que **cumplen** el criterio y 8 tipos de barrera documentados, que las pruebas verifican como estado actual.

## 1. Herramientas y método

| Tipo | Herramienta | Uso |
| :--- | :--- | :--- |
| Automática | **axe-core 4.x** mediante **cypress-axe**, las mismas del equipo | Reglas `wcag2a`, `wcag2aa`, `wcag21a` y `wcag21aa` en cada pantalla, sobre la aplicación en ejecución |
| Manual codificada | Cypress con teclado real (`cy.press(Tab)`), estilos calculados, atributos ARIA y viewport de 320 px | Teclado, trampas de foco, foco visible, orden de foco, etiquetas, idioma, contraste, mensajes de error, reflujo y zoom |

- **Suite:** [`cypress/e2e/cur/a11y/CUR_accesibilidad.cy.js`](../../../cypress/e2e/cur/a11y/CUR_accesibilidad.cy.js).
- **Informes de axe:** [`axe/`](axe/), un JSON por pantalla con las violaciones, el impacto, el criterio WCAG y un elemento de ejemplo.
- **Datos de la exploración previa:** [`exploracion/`](exploracion/), con el orden de Tab, los estilos de foco, el contraste y el comportamiento del modal.

**Línea base.** La auditoría automática guarda el informe de cada pantalla y **falla si aparece una barrera nueva** frente a la línea base de hoy. Así la suite sirve también como regresión de accesibilidad.

**Reintento.** La suite tiene un reintento en `cypress run`, porque a veces la vista de EspoCRM tarda más de 20 s en montarse y eso no es un resultado de accesibilidad. En la ejecución registrada no hizo falta ningún reintento.

```bash
npx cypress run --spec "cypress/e2e/cur/a11y/CUR_accesibilidad.cy.js" --config trashAssetsBeforeRuns=false
```

## 2. Resultados de axe-core por pantalla

Cifras: elementos afectados por regla. Impacto: **C** crítico, **S** serio, **M** moderado.

| Regla axe | WCAG | Impacto | Sandbox | Campaign | Lista de monedas | Detalle COP | Admin › Currency | Modal de tasa |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `label`: campo sin etiqueta asociada | 1.3.1, 4.1.2 | C | 2 | 8 | 6 | 1 | 5 | 2 |
| `button-name`: botón de solo ícono sin nombre | 4.1.2 | C | 1 | 4 | 3 | 1 | — | 1 |
| `color-contrast`: contraste insuficiente | 1.4.3 | S | 1 | 11 | 11 | 8 | 1 | 1 |
| `link-name`: enlace sin texto (barra de navegación) | 2.4.4, 4.1.2 | S | 12 | 12 | 12 | 12 | 12 | — |
| `aria-command-name`: `role="button"` sin nombre | 4.1.2 | S | 4 | 5 | 4 | 3 | 5 | 2 |
| `html-has-lang`: página sin idioma | 3.1.1 | S | 1 | 1 | 1 | 1 | 1 | — |
| `autocomplete-valid`: valores de autocomplete no estándar | 1.3.5 | S | 1 | 10 | 2 | 1 | 2 | 2 |
| `meta-viewport`: zoom bloqueado | 1.4.4 | M | 1 | 1 | 1 | 1 | 1 | — |
| `link-in-text-block`: enlace distinguible solo por color | 1.4.1 | S | 1 | — | — | — | — | — |
| **Reglas aprobadas** | | | 19 | 18 | 19 | 17 | 18 | 10 |

La mayoría de las barreras vienen del marco común de EspoCRM (barra de navegación, plantilla de campos y modal), no de código propio del módulo. Por eso se repiten en todas las pantallas.

## 3. Comprobaciones manuales

| Caso | Criterio WCAG | Pantalla | Resultado | Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| CP-A11Y-CUR-02 | 2.1.1 Teclado | Campaign | ✔ **Cumple.** Desde *Budget*, Tab lleva al selector de moneda, y escribir «COP» + Enter la elige sin ratón | `exploracion/campaign-select-keyboard.json` |
| CP-A11Y-CUR-03 | 2.1.2 Sin trampas de teclado | Formula Sandbox | ✔ **Cumple.** Tab sale del editor de fórmulas ace y no inserta tabulaciones | `exploracion/ace-tab.json` |
| CP-A11Y-CUR-04 | 2.1.2 Sin trampas de teclado | Modal de tasa | ✔ **Cumple.** Esc cierra el modal y el foco vuelve a un botón de la página | `exploracion/modal-esc-2.json` |
| CP-A11Y-CUR-05 | 2.4.7 Foco visible | Campaign | ✔ **Cumple.** El campo enfocado cambia el borde a azul `rgb(102,175,233)` y muestra un resplandor de 8 px | `exploracion/campaign-focus-2.json` |
| CP-A11Y-CUR-06 | 2.4.3 Orden del foco | Modal de tasa | ✔ **Cumple.** Al abrirse, el foco entra en el diálogo (`role="dialog"`) | `exploracion/modal-open.json` |
| CP-A11Y-CUR-07 | 2.4.3 Orden del foco | Modal de tasa | ✘ **Barrera.** Tras el último campo, Tab manda el foco al `<body>`, fuera del diálogo: el foco no circula dentro del modal | `exploracion/modal-tab.json` |
| CP-A11Y-CUR-08 | 1.3.1 y 4.1.2 Información, relaciones y nombre | Campaign | ✘ **Barrera.** *Name* y *Budget* tienen una etiqueta visible (`label[data-name]`), pero sin `for` ni `aria-label`: un lector de pantalla anuncia «campo de edición» sin decir cuál | `exploracion/campaign-labels.json` |
| CP-A11Y-CUR-09 | 3.1.1 Idioma de la página | Todas | ✘ **Barrera.** `<html>` no tiene `lang`, así que el lector de pantalla puede pronunciar con el idioma equivocado | axe `html-has-lang` |
| CP-A11Y-CUR-10 | 1.4.3 Contraste mínimo | Campaign | ✘ **Barrera.** Las etiquetas usan gris `#969696` sobre blanco: **2.95:1**, cuando el mínimo es 4.5:1 | `axe/contraste-etiqueta-budget.json` |
| CP-A11Y-CUR-11 | 3.3.1 Identificación de errores | Modal de tasa | ✔ **Cumple.** Una tasa menor que 0.0001 muestra en texto «Rate shouldn't be less than 0.0001», y el campo lo enlaza con `aria-describedby` | `exploracion/modal-error.json` |
| CP-A11Y-CUR-12 | 3.3.1 y 4.1.3 Mensajes de estado | Modal de tasa | ✘ **Barrera.** El campo con error no lleva `aria-invalid` y el mensaje es un `role="tooltip"` sin `aria-live`: el error no se anuncia al aparecer | `exploracion/modal-error.json` |
| CP-A11Y-CUR-13 | 1.4.10 Reflujo | Campaign | ✔ **Cumple.** A 320 px de ancho no hay desplazamiento horizontal (ancho del contenido 309 px) | `exploracion/campaign-reflow.json` |
| CP-A11Y-CUR-14 | 1.4.4 Cambio de tamaño del texto | Todas | ✘ **Barrera.** `<meta name="viewport" … maximum-scale=1.0, user-scalable=no>` impide ampliar con los dedos en móviles | axe `meta-viewport` |

## 4. Barreras, severidad y recomendaciones

| # | Barrera | Criterio WCAG | Severidad | Quién la sufre | Recomendación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A11Y-CUR-01 | Campos sin etiqueta asociada | 1.3.1, 4.1.2 (A) | **Alta** | Usuarios de lectores de pantalla | En la plantilla de campos, generar un `id` por campo y `<label for>`, o poner `aria-labelledby` apuntando a `label[data-name]` |
| A11Y-CUR-02 | Botones de solo ícono y `role="button"` sin nombre | 4.1.2 (A) | **Alta** | Lectores de pantalla y control por voz | Agregar `aria-label` (por ejemplo «Más acciones», «Abrir calendario», «Cerrar») o texto oculto `.sr-only` |
| A11Y-CUR-03 | Contraste de etiquetas 2.95:1 | 1.4.3 (AA) | **Media** | Baja visión y pantallas con brillo | Oscurecer `.label-text` a `#767676` o más (4.54:1 sobre blanco) |
| A11Y-CUR-04 | Error de validación no anunciado | 3.3.1 (A), 4.1.3 (AA) | **Media** | Lectores de pantalla | Poner `aria-invalid="true"` en el campo y anunciar el mensaje en una región `aria-live="assertive"` (o `role="alert"`) |
| A11Y-CUR-05 | Página sin idioma | 3.1.1 (A) | **Media** | Lectores de pantalla | `<html lang="…">` según el idioma del usuario (`es`, `en`) |
| A11Y-CUR-06 | Zoom bloqueado en móviles | 1.4.4 (AA) | **Media** | Baja visión en móviles | Quitar `maximum-scale=1.0, user-scalable=no` del meta viewport |
| A11Y-CUR-07 | El foco sale del modal | 2.4.3 (A) | **Baja** | Usuarios de teclado | Mantener el foco dentro del modal mientras esté abierto (ciclo de Tab) y agregar `aria-modal="true"` |
| A11Y-CUR-08 | `autocomplete` con valores no estándar (`espo-…`, `new-password`) | 1.3.5 (AA) | **Baja** | Gestores de contraseñas y autocompletado asistido | En los campos de datos personales usar los tokens estándar; en el resto, `autocomplete="off"` |

## 5. Conclusiones

- **Cumple** lo esencial de teclado y adaptación visual: todo se opera sin ratón, no hay trampas de foco, el foco es visible, el modal recibe el foco al abrirse y el formulario se adapta a 320 px.
- **Barreras más graves:** los nombres accesibles. Faltan etiquetas asociadas y nombres de botones (criterios de nivel A), así que un usuario de lector de pantalla no sabe qué campo está llenando en *Budget* ni en *Rate*.
- **Origen:** la mayoría de las barreras están en el marco común de EspoCRM (plantillas de campos, barra de navegación y modal). Corregirlas en esas plantillas mejora a la vez las cinco funcionalidades del módulo y el resto del CRM.
