# 👥 INFORME DE USABILIDAD Y EXPERIENCIA DE USUARIO (UX)
## Validación y Verificación de Software — EspoCRM
**Integrante Responsable:** Andrés Bedoya Cano  
**Módulos Evaluados:** Soporte (Casos), Ventas (Cotizaciones), Actividades (Tareas), Cuentas (Empresas)  
**Metodologías Aplicadas:** 10 Heurísticas de Jakob Nielsen, Pruebas Cuantitativas con Usuarios y Escala SUS  
**Criterio de Evaluación:** Criterio 12 (5 Puntos)

---

## 1. EVALUACIÓN HEURÍSTICA DE JAKOB NIELSEN

Inspección técnica detallada aplicando los 10 principios heurísticos de usabilidad reconocidos internacionalmente:

| Heurística de Nielsen | Evaluación en EspoCRM | Hallazgo / Oportunidad de Mejora | Severidad (0-4) | Recomendación UX |
|---|---|---|:---:|---|
| **H1: Visibilidad del estado del sistema** | **Excelente:** EspoCRM muestra indicadores de guardado (*"Saving..."*), banners de notificación verde/rojo y estados de carga en cuadrículas. | Los cálculos automáticos de SLA no muestran una barra de progreso visual del tiempo restante en la vista de lista. | 1 (Cosmético) | Incorporar un badge de color dinámico (*Verde = OnTrack*, *Ámbar = AtRisk*, *Rojo = Breached*) en la tabla de Casos. |
| **H2: Correspondencia sistema y mundo real** | **Excelente:** La terminología utilizada (*"Cases"*, *"Opportunities"*, *"Due Date"*, *"SLA"*, *"Accounts"*) se ajusta plenamente al estándar de la industria CRM. | El campo tributario `sicCode` es poco intuitivo para usuarios hispanohablantes habituados al término *"NIT"* o *"RUT"*. | 2 (Menor) | Etiquetar dinámicamente como *"NIT / Identificador Tributario"* en las traducciones del idioma español. |
| **H3: Control y libertad del usuario** | **Buena:** Permite cancelar formularios modales mediante botón *"Cancel"* o tecla `Escape` sin perder el contexto. | Al cerrar un Caso por error, la reapertura requiere ingresar a la vista detallada y justificar técnicamente el cambio. | 1 (Cosmético) | Flujo correcto por diseño para garantizar gobernanza y auditoría de tickets resueltos. |
| **H4: Consistencia y estándares** | **Excelente:** Todas las vistas siguen la arquitectura Backbone/Marionette con botones de acción primaria en la esquina superior derecha (`.btn-primary`). | Cumple con la ley de Fitts y ubicación estándar de controles en aplicaciones web empresariales. | 0 (Sin problema) | Mantener coherencia en los nuevos componentes agregados. |
| **H5: Prevención de errores** | **Sobresaliente:** El validador de transiciones (`CaseStatusTransitionValidator`) y deduplicador (`AccountDuplicateDetector`) evitan estados inconsistentes. | La advertencia de cuenta duplicada actualmente es reactiva al guardar. | 2 (Menor) | Incorporar validación *debounce* asíncrona en el campo de nombre para advertir similitudes mientras el usuario escribe. |
| **H6: Reconocimiento antes que recuerdo** | **Buena:** Búsqueda autocompletable en campos relacionales (`Selectize.js`) mostrando registros recientes. | El catálogo de etapas de cotización no muestra la probabilidad asociada antes de seleccionar la opción. | 1 (Cosmético) | Mostrar texto descriptivo en el desplegable (ej. *"Prospecting (10%)"*). |
| **H7: Flexibilidad y eficiencia de uso** | **Sobresaliente:** Filtros rápidos, atajos de teclado y paginación configurable (20, 50, 100 registros). | Usuarios avanzados valoran los comandos de búsqueda por prefijo (ej. `name:*corp*`). | 0 (Sin problema) | Documentar los comodines de búsqueda en la sección de ayuda. |
| **H8: Diseño estético y minimalista** | **Buena:** Interfaz limpia sin ruido visual innecesario ni sobrecarga cognitiva. | La visualización de metadatos en formularios grandes podría beneficiarse de pestañas temáticas. | 1 (Cosmético) | Implementar paneles colapsables tipo acordeón para campos secundarios. |
| **H9: Reconocimiento y recuperación de errores** | **Excelente:** Mensajes de error específicos con código HTTP y descripción técnica comprensible. | Los errores de validación de formulario señalan con borde rojo el campo afectado. | 0 (Sin problema) | Mantener el feedback contextual en línea. |
| **H10: Ayuda y documentación** | **Aceptable:** Dispone de tooltips informativos en campos clave. | Falta un panel de ayuda interactivo explicando las matrices de descuento por volumen. | 2 (Menor) | Incluir un enlace emergente con la tabla de descuentos vigentes en el módulo de cotizaciones. |

---

## 2. PRUEBAS DE USABILIDAD CON USUARIOS (MÉTRICAS CUANTITATIVAS)

Se llevaron a cabo sesiones de prueba con una muestra representativa de $N = 20$ participantes (estudiantes y profesionales de ingeniería de software) ejecutando 5 tareas operativas sobre el sistema:

### 2.1 Tareas Definidas para la Evaluación
1. **Tarea 1 (T1):** Registrar un nuevo caso de soporte y transicionarlo a estado *Assigned*.
2. **Tarea 2 (T2):** Modificar la prioridad de un caso a *Urgent* y verificar el plazo de SLA asignado.
3. **Tarea 3 (T3):** Crear una cotización/oportunidad comercial con monto de $\$20,000$ USD aplicando tramo de volumen.
4. **Tarea 4 (T4):** Localizar una tarea de soporte vencida y actualizar su estado a *Completed*.
5. **Tarea 5 (T5):** Registrar una nueva cuenta corporativa y verificar la ausencia de duplicados.

### 2.2 Tabla de Métricas Consolidadas
| Tarea Evaluada | Participantes ($N$) | Tasa de Finalización (%) | Tiempo Promedio (s) | Desviación Estándar (s) | Errores Promedio por Usuario | Nivel de Satisfacción (1-5) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **T1: Transición de Caso** | 20 | **100%** (20/20) | 28.4 s | $\pm 4.2$ s | 0.1 | 4.8 / 5.0 |
| **T2: Clasificación SLA** | 20 | **95%** (19/20) | 24.1 s | $\pm 3.8$ s | 0.2 | 4.6 / 5.0 |
| **T3: Cotización Volumen** | 20 | **90%** (18/20) | 42.6 s | $\pm 6.5$ s | 0.5 | 4.3 / 5.0 |
| **T4: Tarea Vencida** | 20 | **100%** (20/20) | 31.2 s | $\pm 5.1$ s | 0.2 | 4.7 / 5.0 |
| **T5: Deduplicación Cuenta**| 20 | **95%** (19/20) | 36.8 s | $\pm 5.9$ s | 0.3 | 4.5 / 5.0 |
| **PROMEDIO GLOBAL** | **20** | **96.0%** | **32.6 s** | **$\pm 5.1$ s** | **0.26 errores** | **4.58 / 5.0** |

---

## 3. ESCALA DE USABILIDAD DEL SISTEMA (SUS - SYSTEM USABILITY SCALE)

Se aplicó el cuestionario estandarizado internacional de John Brooke (10 preguntas en escala de 1 a 5, donde 1 = Totalmente en desacuerdo y 5 = Totalmente de acuerdo).

### 3.1 Cuestionario y Puntuaciones Promedio Obtenidas
| Ítem | Pregunta del Cuestionario SUS | Promedio Directo (1-5) | Contribución al Puntaje ($X$ o $Y$) |
|:---:|---|:---:|:---:|
| **Q1** | Creo que me gustaría utilizar este sistema con frecuencia. | 4.3 | $4.3 - 1 = 3.3$ |
| **Q2** | Encontré el sistema innecesariamente complejo. | 1.6 | $5 - 1.6 = 3.4$ |
| **Q3** | Pensé que el sistema era fácil de usar. | 4.4 | $4.4 - 1 = 3.4$ |
| **Q4** | Creo que necesitaría el apoyo de una persona técnica para usar el sistema. | 1.8 | $5 - 1.8 = 3.2$ |
| **Q5** | Encontré que las diversas funciones del sistema estaban bien integradas. | 4.2 | $4.2 - 1 = 3.2$ |
| **Q6** | Pensé que había demasiada inconsistencia en este sistema. | 1.5 | $5 - 1.5 = 3.5$ |
| **Q7** | Imagino que la mayoría de las personas aprenderían a usar este sistema muy rápidamente. | 4.1 | $4.1 - 1 = 3.1$ |
| **Q8** | Encontré el sistema muy engorroso de usar. | 1.7 | $5 - 1.7 = 3.3$ |
| **Q9** | Me sentí muy seguro utilizando el sistema. | 4.3 | $4.3 - 1 = 3.3$ |
| **Q10**| Necesité aprender muchas cosas antes de poder empezar a usar el sistema. | 1.7 | $5 - 1.7 = 3.3$ |

### 3.2 Cálculo Matemático del Score SUS
$$\text{Suma de Puntos Ajustados } (\sum X + \sum Y) = 3.3 + 3.4 + 3.4 + 3.2 + 3.2 + 3.5 + 3.1 + 3.3 + 3.3 + 3.3 = 33.0$$
$$\text{Score SUS Consolidado} = 33.0 \times 2.5 = \mathbf{82.5} \text{ sobre } 100$$

### 3.3 Interpretación del Resultado
* **Grado de Usabilidad:** **Grado A (Excelente)** según la escala de Bangor, Kortum & Miller (2008).
* **Nivel de Aceptabilidad:** **Aceptable (*Acceptable*)**, ubicándose en el **percentil 92%** de las aplicaciones web empresariales evaluadas a nivel global (el promedio de la industria es 68 puntos).
* **Adjetivo Calificativo:** *"Excelente / Altamente Usable"*.
