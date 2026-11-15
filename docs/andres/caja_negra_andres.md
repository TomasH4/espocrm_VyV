# 📦 ANÁLISIS FORMAL DE PRUEBAS DE CAJA NEGRA
## Validación y Verificación de Software — EspoCRM
**Integrante Responsable:** Andrés Bedoya Cano  
**Módulos Evaluados:** Soporte (Casos), Ventas (Cotizaciones), Actividades (Tareas), Cuentas (Empresas)  
**Técnicas Formales:** Particiones de Equivalencia (EP) y Análisis de Valores Límite (BVA)  
**Criterio de Evaluación:** Criterio 5 (10 Puntos)

> [!NOTE]
> **Doble Nivel de Verificación Implementado:**
> 1. **Nivel Componente / Test Runner (Criterio 5):** Suite formal automatizada en PHPUnit con **32 casos de prueba** (`CP-CN-01` a `CP-CN-32`) en [`tests/unit/Espo/VyV/Andres/BlackBox/BlackBoxAndresTest.php`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/tests/unit/Espo/VyV/Andres/BlackBox/BlackBoxAndresTest.php). Ejecutable mediante `.\run_blackbox_andres.ps1` (100% pasando en 0.2s).
> 2. **Nivel Sistema / E2E Interfaz y API (Criterio 7):** Suite de 16 pruebas en navegador con Cypress en `cypress/e2e/andres/F*.cy.js`. Ejecutable con `npm run test:andres:e2e`.

---

## 1. PARTICIONES DE EQUIVALENCIA (EQUIVALENCE PARTITIONING - EP)

### 1.1 Funcionalidad 1: Transición de Estados de Casos (`CaseStatusTransitionValidator`)
| Parámetro | Clases de Equivalencia Válidas ($CE_V$) | Clases de Equivalencia Inválidas ($CE_I$) |
|---|---|---|
| `caseId` | $CE_{V1}$: Cadena no vacía con UUID o ID válido (ej. `'case-001'`). | $CE_{I1}$: Cadena vacía `''`, solo espacios `'   '`, o nulo. |
| `targetStatus` | $CE_{V2}$: Valores dentro del catálogo `['New', 'Assigned', 'Pending', 'Closed', 'Rejected']`. | $CE_{I2}$: Estados inexistentes (ej. `'InReview'`, `'Cancelled'`, `'Draft'`). |
| `currentStatus` $\rightarrow$ `targetStatus` | $CE_{V3}$: Transiciones legales del grafo de estados (ej. `New` $\rightarrow$ `Assigned`, `Assigned` $\rightarrow$ `Pending`, `Pending` $\rightarrow$ `Closed`). | $CE_{I3}$: Transición redundante (`current === target`).<br>$CE_{I4}$: Transición ilegal (ej. `New` $\rightarrow$ `Closed`).<br>$CE_{I5}$: Transición desde estado terminal `Rejected`. |
| `resolutionComment` (en reapertura desde `Closed`) | $CE_{V4}$: Texto con longitud $\ge 15$ caracteres. | $CE_{I6}$: Texto con longitud $< 15$ caracteres o nulo. |
| `assignedUserId` | $CE_{V5}$: ID de usuario asignado presente al transicionar a `Assigned` o `Pending`. | $CE_{I7}$: Nulo o vacío cuando el estado destino requiere responsable. |

---

### 1.2 Funcionalidad 2: Cálculo de SLA y Tiempo Límite (`CaseSlaCalculator`)
| Parámetro | Clases de Equivalencia Válidas ($CE_V$) | Clases de Equivalencia Inválidas ($CE_I$) |
|---|---|---|
| `caseId` | $CE_{V1}$: ID válido de caso. | $CE_{I1}$: Vacío o nulo. |
| `priority` | $CE_{V2}$: `['Urgent', 'High', 'Normal', 'Low']`. | $CE_{I2}$: Valores fuera de dominio (ej. `'Critical'`, `'Medium'`, `''`). |
| `createdAt` | $CE_{V3}$: Cadena de fecha ISO 8601 válida (`'YYYY-MM-DD HH:mm:ss'`). | $CE_{I3}$: Fecha inválida, malformada o inexistente (ej. `'2026-02-31'`). |
| `businessHoursOnly` | $CE_{V4}$: Booleano (`true`, `false`). | $CE_{I4}$: Tipos de datos no convertibles. |
| `slaTier` (Resuelto) | $CE_{V5}$: `['Platinum', 'Gold', 'Silver', 'Standard']`. | $CE_{I5}$: Cuenta no encontrada (manejo de fallback a `Standard`). |

---

### 1.3 Funcionalidad 3: Descuentos en Cotizaciones (`QuoteDiscountCalculator`)
| Parámetro | Clases de Equivalencia Válidas ($CE_V$) | Clases de Equivalencia Inválidas ($CE_I$) |
|---|---|---|
| `quoteId` | $CE_{V1}$: ID válido de cotización. | $CE_{I1}$: Cadena vacía o nula. |
| `subtotal` | $CE_{V2}$: Tramo 1: $(0, 1000)$ $\rightarrow$ 0%<br>$CE_{V3}$: Tramo 2: $[1000, 5000)$ $\rightarrow$ 5%<br>$CE_{V4}$: Tramo 3: $[5000, 15000)$ $\rightarrow$ 10%<br>$CE_{V5}$: Tramo 4: $[15000, \infty)$ $\rightarrow$ 15% | $CE_{I2}$: Cero ($0.0$).<br>$CE_{I3}$: Negativo ($< 0.0$).<br>$CE_{I4}$: No numérico. |
| `isVipCustomer` | $CE_{V6}$: `true` (+5% lealtad), `false` (0%). | $CE_{I5}$: Valores nulos o indefinidos (default false). |
| `couponCode` | $CE_{V7}$: Código activo en base de datos.<br>$CE_{V8}$: Ausente/nulo (sin cupón). | $CE_{I6}$: Código inexistente o expirado. |
| `totalDiscount` | $CE_{V9}$: $[0.0\%, 35.0\%]$ dentro del límite permitido. | $CE_{I7}$: $> 35.0\%$ (debe activar Cap de protección a 35%). |

---

### 1.4 Funcionalidad 4: Evaluación de Tareas Vencidas (`TaskOverdueEvaluator`)
| Parámetro | Clases de Equivalencia Válidas ($CE_V$) | Clases de Equivalencia Inválidas ($CE_I$) |
|---|---|---|
| `taskId` | $CE_{V1}$: ID válido de tarea. | $CE_{I1}$: Cadena vacía o nula. |
| `status` | $CE_{V2}$: `['Not Started', 'Started', 'Completed', 'Canceled', 'Deferred']`. | $CE_{I2}$: Estados desconocidos. |
| `dueDate` | $CE_{V3}$: Fecha válida. | $CE_{I3}$: Fecha inválida. |
| `overdueDays` (Calculado) | $CE_{V4}$: $0$ días (En tiempo $\rightarrow$ Severidad `None`).<br>$CE_{V5}$: $[1, 2]$ días $\rightarrow$ Severidad `Minor`.<br>$CE_{V6}$: $[3, 7]$ días $\rightarrow$ Severidad `Moderate` (Escalado Supervisor).<br>$CE_{V7}$: $> 7$ días $\rightarrow$ Severidad `Critical` (Escalado Gerente). | N/A (calculado internamente a partir de marcas temporales). |

---

### 1.5 Funcionalidad 5: Detección de Cuentas Duplicadas (`AccountDuplicateDetector`)
| Parámetro | Clases de Equivalencia Válidas ($CE_V$) | Clases de Equivalencia Inválidas ($CE_I$) |
|---|---|---|
| `name` | $CE_{V1}$: Cadena de texto no vacía con razón social. | $CE_{I1}$: Cadena vacía o solo espacios. |
| `sicCode` | $CE_{V2}$: NIT / Tax ID alfanumérico existente.<br>$CE_{V3}$: NIT único o nulo. | N/A (opcional). |
| `matchScore` (Calculado) | $CE_{V4}$: $[70, 100]$ Coincidencia `High` (`isDuplicate = true`).<br>$CE_{V5}$: $[40, 69]$ Coincidencia `Moderate` (`isDuplicate = true`).<br>$CE_{V6}$: $[0, 39]$ Coincidencia `Low` (`isDuplicate = false`). | N/A (acotado formalmente en el rango $[0, 100]$). |

---

## 2. ANÁLISIS DE VALORES LÍMITE (BOUNDARY VALUE ANALYSIS - BVA)

### 2.1 Fronteras en Tramos de Descuento por Volumen (Cotizaciones)
* **Frontera 1 ($1,000.00):**
  * $min - 1$: $\$999.99 \rightarrow$ Tramo 1 (0% de descuento).
  * $min$: $\$1,000.00 \rightarrow$ Tramo 2 (5% de descuento).
  * $min + 1$: $\$1,000.01 \rightarrow$ Tramo 2 (5% de descuento).
* **Frontera 2 ($5,000.00):**
  * $min - 1$: $\$4,999.99 \rightarrow$ Tramo 2 (5% de descuento).
  * $min$: $\$5,000.00 \rightarrow$ Tramo 3 (10% de descuento).
  * $min + 1$: $\$5,000.01 \rightarrow$ Tramo 3 (10% de descuento).
* **Frontera 3 ($15,000.00):**
  * $min - 1$: $\$14,999.99 \rightarrow$ Tramo 3 (10% de descuento).
  * $min$: $\$15,000.00 \rightarrow$ Tramo 4 (15% de descuento).
  * $min + 1$: $\$15,000.01 \rightarrow$ Tramo 4 (15% de descuento).
* **Frontera de Protección de Margen (Cap 35.0%):**
  * $max - 1$: $34.99\% \rightarrow$ Se aplica $34.99\%$, `isCapped = false`.
  * $max$: $35.00\% \rightarrow$ Se aplica $35.00\%$, `isCapped = false`.
  * $max + 1$: $35.01\% \rightarrow$ Se limita a $35.00\%$, `isCapped = true`.

### 2.2 Fronteras en Longitud de Justificación de Reapertura de Casos
* **Frontera ($15$ caracteres):**
  * $min - 1$: $14$ caracteres (ej. `'Reabrir ticket'`) $\rightarrow$ Error 422 (Rechazado).
  * $min$: $15$ caracteres (ej. `'Reapertura just'`) $\rightarrow$ Aceptado (200).
  * $min + 1$: $16$ caracteres (ej. `'Reapertura justi'`) $\rightarrow$ Aceptado (200).

### 2.3 Fronteras en Días de Mora de Tareas
* **Frontera Menor a Moderada ($2$ a $3$ días):**
  * $2$ días $\rightarrow$ Severidad `Minor` (Sin escalado).
  * $3$ días $\rightarrow$ Severidad `Moderate` (Escalado a Supervisor).
* **Frontera Moderada a Crítica ($7$ a $8$ días):**
  * $7$ días $\rightarrow$ Severidad `Moderate` (Escalado a Supervisor).
  * $8$ días $\rightarrow$ Severidad `Critical` (Escalado a Gerente).

---

## 3. MATRIZ DE CASOS DE PRUEBA FORMALES DE CAJA NEGRA

| ID Caso | Módulo | Funcionalidad | Técnica | Entrada de Prueba | Resultado Esperado | Estado |
|:---:|:---:|---|:---:|---|---|:---:|
| **CP-CN-01** | Soporte | Transición de Casos | EP ($CE_{I1}$) | `caseId: ""` | Código 400: "caseId es obligatorio" | `PASSED` |
| **CP-CN-02** | Soporte | Transición de Casos | EP ($CE_{I2}$) | `targetStatus: "InReview"` | Código 400: "Estado destino inválido" | `PASSED` |
| **CP-CN-03** | Soporte | Transición de Casos | EP ($CE_{I3}$) | `current: "New"`, `target: "New"` | Código 400: "Estado destino debe ser diferente" | `PASSED` |
| **CP-CN-04** | Soporte | Transición de Casos | EP ($CE_{I4}$) | `current: "New"`, `target: "Closed"` | Código 422: "Transición ilegal" | `PASSED` |
| **CP-CN-05** | Soporte | Transición de Casos | BVA ($14$ chars) | `current: "Closed"`, `comment: 14 chars` | Código 422: "Requiere justificación >= 15 chars" | `PASSED` |
| **CP-CN-06** | Soporte | Transición de Casos | BVA ($15$ chars) | `current: "Closed"`, `comment: 15 chars` | Código 200: Reapertura exitosa | `PASSED` |
| **CP-CN-07** | Soporte | Transición de Casos | EP ($CE_{I7}$) | `target: "Assigned"`, `assignedUserId: null` | Código 422: "Requiere usuario asignado" | `PASSED` |
| **CP-CN-08** | Soporte | Cálculo de SLA | EP ($CE_{I2}$) | `priority: "MegaUrgent"` | Código 400: "Prioridad no válida" | `PASSED` |
| **CP-CN-09** | Soporte | Cálculo de SLA | EP ($CE_{V5}$) | `tier: "Platinum"`, `priority: "Urgent"` | Código 200: Response = 0.5h, Resol = 2.0h | `PASSED` |
| **CP-CN-10** | Soporte | Cálculo de SLA | BVA (Breach) | `now > resolutionDue` | Código 200: Estatus `Breached` | `PASSED` |
| **CP-CN-11** | Soporte | Cálculo de SLA | BVA (20% rem) | `remaining <= 20% total` | Código 200: Estatus `AtRisk` | `PASSED` |
| **CP-CN-12** | Ventas | Descuento Cotizaciones | EP ($CE_{I2}$) | `subtotal: 0.0` | Código 400: "Subtotal debe ser > 0" | `PASSED` |
| **CP-CN-13** | Ventas | Descuento Cotizaciones | BVA ($999.99) | `subtotal: 999.99` | Código 200: Descuento volumen = 0% | `PASSED` |
| **CP-CN-14** | Ventas | Descuento Cotizaciones | BVA ($1000.00)| `subtotal: 1000.00` | Código 200: Descuento volumen = 5% | `PASSED` |
| **CP-CN-15** | Ventas | Descuento Cotizaciones | BVA ($4999.99)| `subtotal: 4999.99` | Código 200: Descuento volumen = 5% | `PASSED` |
| **CP-CN-16** | Ventas | Descuento Cotizaciones | BVA ($5000.00)| `subtotal: 5000.00` | Código 200: Descuento volumen = 10% | `PASSED` |
| **CP-CN-17** | Ventas | Descuento Cotizaciones | BVA ($15000.0)| `subtotal: 15000.00` | Código 200: Descuento volumen = 15% | `PASSED` |
| **CP-CN-18** | Ventas | Descuento Cotizaciones | EP ($CE_{V6}$) | `isVip: true` | Código 200: +5% adicional lealtad VIP | `PASSED` |
| **CP-CN-19** | Ventas | Descuento Cotizaciones | EP ($CE_{I6}$) | `coupon: "EXPIRED_99"` | Código 400: "Cupón inválido o expirado" | `PASSED` |
| **CP-CN-20** | Ventas | Descuento Cotizaciones | BVA (Cap > 35%)| Total calculado = 40% (15+5+20) | Código 200: Limitado a 35%, `isCapped: true` | `PASSED` |
| **CP-CN-21** | Actividades | Tareas Vencidas | EP ($CE_{V2}$) | `status: "Completed"` | Código 200: Mora = 0, Severidad = None | `PASSED` |
| **CP-CN-22** | Actividades | Tareas Vencidas | BVA ($2$ días) | `overdueDays: 2`, `Normal` | Código 200: Severidad `Minor`, sin escalado | `PASSED` |
| **CP-CN-23** | Actividades | Tareas Vencidas | BVA ($3$ días) | `overdueDays: 3`, `Normal` | Código 200: Severidad `Moderate`, escalado a Supervisor | `PASSED` |
| **CP-CN-24** | Actividades | Tareas Vencidas | BVA ($7$ días) | `overdueDays: 7`, `Normal` | Código 200: Severidad `Moderate`, escalado a Supervisor | `PASSED` |
| **CP-CN-25** | Actividades | Tareas Vencidas | BVA ($8$ días) | `overdueDays: 8`, `Normal` | Código 200: Severidad `Critical`, escalado a Gerente | `PASSED` |
| **CP-CN-26** | Actividades | Tareas Vencidas | EP (Urgent mora)| `overdueDays: 1`, `Urgent` | Código 200: Severidad `Critical` inmediata | `PASSED` |
| **CP-CN-27** | Cuentas | Detección Duplicados | EP ($CE_{I1}$) | `name: ""` | Código 400: "name es obligatorio" | `PASSED` |
| **CP-CN-28** | Cuentas | Detección Duplicados | EP ($CE_{V2}$) | Coincidencia exacta de NIT | Código 200: Score 90, MatchLevel `High` | `PASSED` |
| **CP-CN-29** | Cuentas | Detección Duplicados | EP (Legal Suffix)| `"Acme Corp S.A.S."` vs `"Acme Corp"` | Código 200: Score 70, MatchLevel `High` | `PASSED` |
| **CP-CN-30** | Cuentas | Detección Duplicados | EP (Levenshtein)| `"Soluciones Globale"` vs `"Soluciones Globales"` | Código 200: Similitud $\ge 80\%$, Score 40 `Moderate` | `PASSED` |
| **CP-CN-31** | Cuentas | Detección Duplicados | EP (Clean Web) | `"https://www.acme.co/info"` vs `"acme.co"` | Código 200: Dominio corporativo +30 pts | `PASSED` |
| **CP-CN-32** | Cuentas | Detección Duplicados | EP (Sin Coincidencia)| Razón social única | Código 200: Score 0, MatchLevel `Low`, `isDuplicate: false` | `PASSED` |
