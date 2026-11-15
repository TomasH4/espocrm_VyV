# ♿ INFORME FORMAL DE ACCESIBILIDAD WEB (WCAG 2.1 NIVEL AA)
## Validación y Verificación de Software — EspoCRM
**Integrante Responsable:** Andrés Bedoya Cano  
**Estándar Aplicado:** Web Content Accessibility Guidelines (WCAG) 2.1 Nivel AA  
**Herramientas Empleadas:** Cypress-Axe (Axe-Core v4.x) y Pruebas Manuales de Interacción  
**Criterio de Evaluación:** Criterio 11 (5 Puntos)

---

## 1. RESUMEN DE LA AUDITORÍA AUTOMATIZADA (AXE-CORE)

Se ejecutó la suite automatizada sobre las 4 vistas críticas de las funcionalidades asignadas:
1. `/#Case` (Módulo de Casos y Soporte Técnico)
2. `/#Opportunity` (Módulo de Ventas y Cotizaciones)
3. `/#Task` (Módulo de Tareas y Actividades)
4. `/#Account` (Módulo de Directorio de Cuentas Corporativas)

### 1.1 Resultados Globales de Ejecución
* **Total de Pruebas Ejecutadas:** 6
* **Pruebas Aprobadas:** 6 (100%)
* **Tiempo Total de Ejecución:** 16 segundos
* **Archivo de Prueba:** `cypress/e2e/andres/a11y/accessibility_wcag.cy.js`

---

## 2. BARRERAS DE ACCESIBILIDAD DETECTADAS Y CRITERIOS WCAG AFECTADOS

| ID Barrera | Criterio WCAG 2.1 | Nivel | Componente Afectado | Descripción del Hallazgo | Impacto / Severidad | Recomendación Técnica |
|:---:|:---:|:---:|---|---|:---:|---|
| **BAR-A11Y-01** | **1.4.3 Contraste (Mínimo)** | AA | Textos de ayuda y placeholders (`.text-muted`, `.field-description`) | La relación de contraste de color entre el texto gris tenue (`#888888`) y el fondo blanco (`#FFFFFF`) es de $3.5:1$, inferior al estándar exigido de $4.5:1$ para texto regular. | Moderado | Modificar el CSS temático para oscurecer el texto secundario a un gris mínimo `#595959` garantizando contraste $\ge 4.5:1$. |
| **BAR-A11Y-02** | **1.3.1 Información y Relaciones** | A | Inputs de búsqueda rápida (`.main-search-input`) | El campo de búsqueda global no cuenta con una etiqueta visible `<label>` ni un atributo accesible `aria-label="Buscar registros"`, dificultando la orientación en lectores de pantalla (NVDA, JAWS). | Serio | Agregar el atributo `aria-label="Buscar en Casos y Cuentas"` o asociar un `<label class="sr-only">`. |
| **BAR-A11Y-03** | **2.4.7 Foco Visible** | AA | Enlaces de navegación rápida y botones de paginación (`.pagination a`) | Al navegar mediante la tecla `Tab`, el indicador de foco (`outline`) en los enlaces de paginación es suprimido mediante `outline: none` en las reglas de estilo de Bootstrap heredado. | Serio | Restablecer un indicador visual de foco consistente (`outline: 2px solid #005fcc; outline-offset: 2px;`) cuando el elemento reciba `:focus-visible`. |
| **BAR-A11Y-04** | **4.1.2 Nombre, Función, Valor** | A | Selectores desplegables personalizados (`Selectize.js`) | Los menús desplegables de selección múltiple y búsqueda asíncrona generan un contenedor `div.selectize-input` sin atributos `role="combobox"` ni `aria-expanded` actualizados dinámicamente. | Crítico | Configurar atributos ARIA dinámicos en el puente de Selectize para anunciar el estado expandido/colapsado a la API de accesibilidad. |

---

## 3. VERIFICACIONES MANUALES DETALLADAS

### 3.1 Navegación por Teclado (Keyboard Only)
* **Metodología:** Operación completa de creación y consulta de Casos y Tareas utilizando exclusivamente el teclado (`Tab`, `Shift+Tab`, `Enter`, `Espacio`, `Escape`).
* **Comportamiento Observado:**
  * La secuencia de tabulación sigue un orden lógico de lectura de izquierda a derecha y de arriba hacia abajo (`tabindex` natural respetado).
  * Los modales emergentes capturan el foco al abrirse y lo devuelven al elemento disparador al cerrarse mediante la tecla `Escape`.
  * Los campos de texto y áreas de edición permiten entrada limpia de datos sin trampas de teclado (*No Keyboard Traps*, Criterio 2.1.2).

### 3.2 Adaptación Visual y Zoom (Reflow 400%)
* **Criterio Evaluado:** 1.4.10 Reflow (Zoom al 400% a resolución de 1280px).
* **Resultado:** La SPA reorganiza los paneles laterales y contrae la barra de navegación en un menú tipo hamburguesa accesible, sin requerir desplazamiento horizontal bidimensional.
