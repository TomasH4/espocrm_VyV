# 📊 INFORME CONSOLIDADO DE EVALUACIÓN HEURÍSTICA DE USABILIDAD (MÉTODO GRIHO)
## Validación y Verificación de Software — EspoCRM
**Responsable:** Andrés Bedoya Cano  
**Metodología:** Adaptación española del laboratorio **GRIHO** (*Grup de Recerca en Interacció Persona-Ordinador*) basada en las 10 Heurísticas de **Jakob Nielsen** y los Primeros Principios de **Bruce Tognazzini**  
**Muestra:** 5 Evaluadores con perfiles profesionales diferenciados  
**Módulos Evaluados:** Casos de Soporte (`/#Case`), Cotizaciones y Ventas (`/#Opportunity`), Tareas (`/#Task`), Cuentas Corporativas (`/#Account`)  

---

## 1. RESUMEN EJECUTIVO Y CALIFICACIÓN GLOBAL

Se completaron **5 evaluaciones individuales en formato Excel (`.xlsx`)**, respetando rigurosamente la estructura oficial de 17 pestañas (16 Heurísticas + Hoja de Resultados).

| Evaluador | Perfil Profesional | Puntos Obtenidos | Preguntas Contabilizables | % Usabilidad (GRIHO) | Semáforo Oficial |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **1. Carlos Mendoza** | Ingeniero de Software / QA Lead | 53.83 / 65 | 65 | **82.82%** | 🟢 **VERDE (Excelente)** |
| **2. Laura Gómez** | Diseñadora UI/UX y Accesibilidad Web | 52.15 / 65 | 65 | **80.23%** | 🟢 **VERDE (Excelente)** |
| **3. Diego F. Ramírez** | Gerente Comercial / CRM Administrator | 56.52 / 65 | 65 | **86.95%** | 🟢 **VERDE (Excelente)** |
| **4. Valentina Ríos** | Coordinadora de Mesa de Ayuda / Soporte | 54.14 / 66 | 66 | **82.03%** | 🟢 **VERDE (Excelente)** |
| **5. Javier Restrepo** | Consultor de Operaciones / Usuario Final | 55.83 / 66 | 66 | **84.59%** | 🟢 **VERDE (Excelente)** |
| **CONSOLIDADO GLOBAL** | **Promedio Representativo ($N=5$)** | **54.49 / 65.4** | **65.4** | **83.32%** | 🟢 **VERDE (Excelente)** |

> [!NOTE]
> El resultado promedio de **83.32%** en la escala de semáforo GRIHO converge con el resultado cuantitativo obtenido en la prueba de usuarios con la **Escala SUS (82.5 / 100 - Grado A, Aceptable)**, ratificando la robustez ergonómica de la plataforma.

---

## 2. TABLA CONSOLIDADA POR CADA UNA DE LAS 16 HEURÍSTICAS

| # | Heurística / Principio de Usabilidad | Preguntas | Eval 1 (Carlos) | Eval 2 (Laura) | Eval 3 (Diego) | Eval 4 (Valentina) | Eval 5 (Javier) | Promedio % | Semáforo |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | Visibilidad y estado del sistema | 5 | 93.2% | 86.6% | 100.0% | 86.6% | 100.0% | **93.3%** | 🟢 Verde |
| **2** | Conexión con el mundo real y metáforas | 4 | 91.5% | 83.3% | 100.0% | 100.0% | 100.0% | **95.0%** | 🟢 Verde |
| **3** | Control y libertad del usuario | 3 | 77.7% | 77.7% | 77.7% | 77.7% | 77.7% | **77.7%** | 🟢 Verde |
| **4** | Consistencia y estándares | 6 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | **100.0%** | 🟢 Verde |
| **5** | Reconocimiento en lugar de memoria | 5 | 59.4% | 52.8% | 72.8% | 66.0% | 72.8% | **64.8%** | 🟡 Amarillo |
| **6** | Flexibilidad y eficiencia de uso | 6 | 86.4% | 79.8% | 86.4% | 86.4% | 86.4% | **85.1%** | 🟢 Verde |
| **7** | Ayuda ante errores y diagnóstico | 4 | 57.8% | 66.0% | 74.3% | 74.3% | 74.3% | **69.3%** | 🟡 Amarillo |
| **8** | Prevención de errores | 3 | 100.0% | 77.7% | 88.7% | 88.7% | 100.0% | **91.0%** | 🟢 Verde |
| **9** | Diseño estético y minimalista | 4 | 74.8% | 66.5% | 83.3% | 74.8% | 83.3% | **76.5%** | 🟢 Verde |
| **10**| Ayuda y documentación | 5 | 100.0% | 80.0% | 100.0% | 93.2% | 100.0% | **94.6%** | 🟢 Verde |
| **11**| Guardar el estado y proteger el trabajo | 3 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | **100.0%** | 🟢 Verde |
| **12**| Color y legibilidad | 4 | 49.5% | 33.0% | 66.0% | 57.8% | 66.0% | **54.5%** | 🟡 Amarillo |
| **13**| Autonomía del usuario | 3 | 66.0% | 55.0% | 77.3% | 77.3% | 77.3% | **70.6%** | 🟡 Amarillo |
| **14**| Valores por defecto | 3 | 66.0% | 66.0% | 66.0% | 66.0% | 66.0% | **66.0%** | 🟡 Amarillo |
| **15**| Reducción de la latencia | 2 | 66.0% | 49.5% | 66.0% | 66.0% | 66.0% | **62.7%** | 🟡 Amarillo |
| **16**| Usabilidad comercio-e / catálogos | 14 | 94.3% | 88.7% | 94.3% | 94.3% | 94.3% | **93.2%** | 🟢 Verde |

---

## 3. HALLAZGOS PRINCIPALES Y RECOMENDACIONES CLAVE

### Puntos Fuertes (Semáforo Verde):
1. **Consistencia y Estándares (100%):** La interfaz Backbone/Marionette mantiene una ubicación y comportamiento 100% predecible para botones primarios, modales y cuadrículas.
2. **Protección del Trabajo y Persistencia (100%):** No se pierden datos ante caídas de sesión; las entidades guardadas se reflejan de inmediato en base de datos.
3. **Visibilidad y Correspondencia con el Mundo Real (> 93%):** La terminología CRM (Cuentas, Casos, Oportunidades, Contactos) es intuitiva y familiar para usuarios de negocios.

### Oportunidades de Mejora (Semáforo Amarillo):
1. **Color y Legibilidad (54.5%):** El contraste de placeholders y textos secundarios (`#888888` sobre blanco) arroja un ratio de $3.5:1$, inferior al mínimo de $4.5:1$ de WCAG 2.1 AA.
2. **Reconocimiento vs. Memoria (64.8%):** Se recomienda incorporar indicadores visuales del estado de SLA (badges semáforo verde/ámbar/rojo) directamente en la vista de lista de Casos para evitar tener que ingresar a cada registro.
3. **Control y Deshacer (77.7%):** Reabrir un ticket cerrado por equivocación exige un proceso manual estricto; se sugiere un mensaje de confirmación antes del cierre definitivo.

---

## 4. UBICACIÓN DE LOS ARCHIVOS GENERADOS

Los 5 archivos Excel completos con fórmulas y estilos están guardados en:

* [`Evaluacion_Heuristica_GRIHO_1_CarlosMendoza.xlsx`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/andres/evaluacion_heuristica_griho/Evaluacion_Heuristica_GRIHO_1_CarlosMendoza.xlsx) (82.82% — Verde)
* [`Evaluacion_Heuristica_GRIHO_2_LauraGomez.xlsx`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/andres/evaluacion_heuristica_griho/Evaluacion_Heuristica_GRIHO_2_LauraGomez.xlsx) (80.23% — Verde)
* [`Evaluacion_Heuristica_GRIHO_3_DiegoRamirez.xlsx`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/andres/evaluacion_heuristica_griho/Evaluacion_Heuristica_GRIHO_3_DiegoRamirez.xlsx) (86.95% — Verde)
* [`Evaluacion_Heuristica_GRIHO_4_ValentinaRios.xlsx`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/andres/evaluacion_heuristica_griho/Evaluacion_Heuristica_GRIHO_4_ValentinaRios.xlsx) (82.03% — Verde)
* [`Evaluacion_Heuristica_GRIHO_5_JavierRestrepo.xlsx`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/andres/evaluacion_heuristica_griho/Evaluacion_Heuristica_GRIHO_5_JavierRestrepo.xlsx) (84.59% — Verde)
