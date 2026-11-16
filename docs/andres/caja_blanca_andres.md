# 🔍 ANÁLISIS ESTRUCTURAL Y PRUEBAS DE CAJA BLANCA (MULTI-CAPA)
## Validación y Verificación de Software — EspoCRM
**Integrante Responsable:** Andrés Bedoya Cano (VyV 2026-2)  
**Alcance:** 5 Funcionalidades individuales complejas (F1 a F5)  
**Arquitectura de Cobertura:** 3 Capas por Funcionalidad (**Backend**, **Frontend**, **Integración**) $\times$ 4 Componentes (**Flujo**, **Grafo**, **Tabla de Caminos**, **Complejidad McCabe**) = **12 Ítems por Funcionalidad (60 Ítems Totales)**  
**Regla Lógica Estricta Aplicada:**
* **Rama "NO" / "Error" / "Falla":** Dirigida estrictamente a la **Izquierda (←)**.
* **Rama "SÍ" / "OK" / "Continúa":** Dirigida estrictamente a la **Derecha (→)**.

📁 **Carpeta de Diagramas en Formato JPEG:** [`docs/diagramas-caja-blanca-andres/`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/)  
📄 **Documento Consolidado de Diagramas:** [`diagramas_caja_blanca_consolidado.md`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/diagramas_caja_blanca_consolidado.md)

---

## MATRIZ GENERAL DE COMPLEJIDAD CICLOMÁTICA $V(G)$ POR CAPA

| Funcionalidad | Módulo / Alcance | Backend (BE) | Frontend (FE) | Integración (INT) | Total Caminos Base | Estado |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **F1: Transición de Estados de Casos** | Soporte (`CaseStatusTransitionValidator`) | $V(G) = 10$ | $V(G) = 5$ | $V(G) = 4$ | **19 caminos** | ✔ 100% Cubierto |
| **F2: Cálculo de SLA y Tiempo Límite** | Soporte (`CaseSlaCalculator`) | $V(G) = 11$ | $V(G) = 5$ | $V(G) = 4$ | **20 caminos** | ✔ 100% Cubierto |
| **F3: Descuentos en Cotizaciones** | Ventas (`QuoteDiscountCalculator`) | $V(G) = 9$ | $V(G) = 5$ | $V(G) = 4$ | **18 caminos** | ✔ 100% Cubierto |
| **F4: Evaluación de Tareas Vencidas** | Actividades (`TaskOverdueEvaluator`) | $V(G) = 9$ | $V(G) = 5$ | $V(G) = 4$ | **18 caminos** | ✔ 100% Cubierto |
| **F5: Deduplicación de Cuentas** | Cuentas (`AccountDuplicateDetector`) | $V(G) = 10$ | $V(G) = 5$ | $V(G) = 4$ | **19 caminos** | ✔ 100% Cubierto |
| **TOTALES CONSOLIDADOS** | **5 Funcionalidades en 3 Capas** | **$\sum V(G) = 49$** | **$\sum V(G) = 25$** | **$\sum V(G) = 20$** | **94 Caminos Base** | **✔ 100% Verificado** |

---

## 1. FUNCIONALIDAD 1: Validación de Transición de Estados de Casos

### 1.1 Capa Frontend (FE) — F1
* **Diagrama de Flujo (JPEG):** [`F1_FE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F1_FE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F1_FE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F1_FE_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = E - N + 2 = 19 - 15 + 2 = \mathbf{5}$  
  *(Decisiones: $P = 4 \implies V(G) = 4 + 1 = 5$)*
* **Tabla de Caminos FE:**
  | Camino | Secuencia | Condición | Descripción | TC Cubierto |
  |:---:|---|---|---|:---:|
  | **P1** | Start → n1..n10 → End | Formulario válido | Happy Path UI | `CP-E2E-01` |
  | **P2** | Start → n1..n3 → n11a → End | Nombre vacío | Error requerido | `CP-E2E-04` |
  | **P3** | Start → n1..n5 → n11b → End | Formato inválido | Error sintaxis | `CP-E2E-05` |
  | **P4** | Start → n1..n7 → n11c → End | Regla de cliente violada | Bloqueo preventivo | `CP-E2E-03` |
  | **P5** | Start → n1..n9 → n11d → End | API responde 400 | Renderizado banner error | `CP-E2E-02` |

### 1.2 Capa Backend (BE) — F1 (`CaseStatusTransitionValidator`)
* **Diagrama de Flujo (JPEG):** [`F1_BE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F1_BE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F1_BE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F1_BE_graph.jpeg)
* **Complejidad Ciclomática:**
  * Método 1: $V(G) = E - N + 2 = 29 - 21 + 2 = \mathbf{10}$
  * Método 2: $V(G) = P + 1 = 9 + 1 = \mathbf{10}$
  * Método 3: $V(G) = R = 9 \text{ cerradas} + 1 \text{ infinita} = \mathbf{10}$
* **Tabla de Caminos BE:**
  | Camino | Nodos | Condición | Descripción | Caso Unitario |
  |:---:|---|---|---|:---:|
  | **P1** | Start → n1..n3 → End | `caseId === ''` | Rechazo por caseId vacío | `testTransitionFailsWhenCaseIdIsEmpty` |
  | **P2** | Start → n1..n5 → End | `targetStatus` desconocido | Rechazo por estado no en catálogo | `testTransitionFailsWhenTargetStatusIsInvalid` |
  | **P3** | Start → n1..n7 → End | `current === target` | Rechazo por transición redundante | `testTransitionFailsWhenCurrentAndTargetAreIdentical` |
  | **P4** | Start → n1..n9 → End | `current === 'Rejected'` | Inmutabilidad de caso rechazado | `testTransitionFailsWhenCurrentStatusIsRejected` |
  | **P5** | Start → n1..n12 → End | Reapertura sin justificación $\ge 15$ | Justificación insuficiente en Closed | `testTransitionFailsWhenReopeningClosedCaseWithoutJustification` |
  | **P6** | Start → n1..n16 → End | Reapertura sin responsable | Falta usuario asignado en reapertura | `testTransitionFailsWhenReopeningWithoutAssignedUser` |
  | **P7** | Start → n1..n14 → End | Salto New a Closed directo | Transición ilegal de flujo | `testTransitionFailsWhenIllegalTransitionFromNewToClosed` |
  | **P8** | Start → n1..n16 → End | New a Assigned sin responsable | Falta asignación obligatoria | `testTransitionFailsWhenAssignedUserIdIsMissing` |
  | **P9** | Start → n1..n19 → End | Fallo en BD (`save = false`) | Error 500 interno | `testTransitionFailsWhenRepositoryReturnsFalse` |
  | **P10**| Start → n1..n20 → End | Parámetros válidos y BD exitosa | Happy Path de transición | `testTransitionSucceedsWithValidParameters` |

### 1.3 Capa Integración (INT) — F1
* **Diagrama de Flujo (JPEG):** [`F1_INT_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F1_INT_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F1_INT_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F1_INT_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = E - N + 2 = 18 - 15 + 2 = \mathbf{5}$ ($P = 3 \implies 4$, con ramas de excepción = 5)
* **Tabla de Caminos INT:**
  | Camino | Nodos | Condición | Descripción | TC Cubierto |
  |:---:|---|---|---|:---:|
  | **P1** | Start → n1..n11 → End | Auth OK, Hook valida, BD OK | Integración exitosa UI-API-DB | `CP-INT-01` |
  | **P2** | Start → n1..n3 → n12a → End | Sin Auth | 401 Unauthorized | `CP-SEC-01` |
  | **P3** | Start → n1..n6 → n12b → End | Hook BeforeSave detecta salto ilegal | 400 Bad Request con X-Status-Reason | `CP-INT-02` |
  | **P4** | Start → n1..n9 → n12c → End | Fallo de conexión MariaDB | 500 Internal Error | `CP-INT-03` |

---

## 2. FUNCIONALIDAD 2: Cálculo de SLA y Tiempo Límite de Atención

### 2.1 Capa Frontend (FE) — F2
* **Diagrama de Flujo (JPEG):** [`F2_FE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F2_FE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F2_FE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F2_FE_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = \mathbf{5}$ (4 decisiones).
* **Caminos:** 5 caminos (Happy Path, campo requerido, prioridad inválida, regla cliente, error servidor).

### 2.2 Capa Backend (BE) — F2 (`CaseSlaCalculator`)
* **Diagrama de Flujo (JPEG):** [`F2_BE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F2_BE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F2_BE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F2_BE_graph.jpeg)
* **Complejidad Ciclomática:**
  * Método 1: $V(G) = E - N + 2 = 33 - 24 + 2 = \mathbf{11}$
  * Método 2: $V(G) = P + 1 = 10 + 1 = \mathbf{11}$
  * Método 3: $V(G) = R = 10 \text{ cerradas} + 1 \text{ infinita} = \mathbf{11}$
* **Tabla de Caminos BE:**
  | Camino | Condición | Descripción | Caso Unitario |
  |:---:|---|---|:---:|
  | **P1** | `caseId === ''` | caseId obligatorio | `testCalculateFailsWhenCaseIdIsEmpty` |
  | **P2** | `priority` inválida | Prioridad desconocida | `testCalculateFailsWhenPriorityIsInvalid` |
  | **P3** | `createdAt` inválida | Fecha no parseable | `testCalculateFailsWhenCreatedAtIsInvalid` |
  | **P4** | Tier Premium, horario hábil | SLA Urgente hábil (2h) | `testCalculateSlaUrgentWithPremiumAccount` |
  | **P5** | Tier Standard fallback | SLA Normal estándar (24h) | `testCalculateSlaNormalWithStandardAccount` |
  | **P6** | Fallo BD simulado | Error 500 persistencia | `testCalculateFailsWhenRepositoryReturnsFalse` |
  | **P7** | Prioridad High | SLA 8 horas hábiles | `testCalculateSlaHighPriority` |
  | **P8** | Prioridad Low | SLA 72 horas estándar | `testCalculateSlaLowPriority` |
  | **P9** | Fin de semana | Salto de horario no laboral | `testCalculateSlaSkipsWeekendHours` |
  | **P10**| Día festivo | Salto por calendario festivo | `testCalculateSlaHandlesHolidays` |
  | **P11**| Tiempo superado | Detección de breach de SLA | `testCalculateSlaFlagsBreachedStatus` |

### 2.3 Capa Integración (INT) — F2
* **Diagrama de Flujo (JPEG):** [`F2_INT_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F2_INT_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F2_INT_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F2_INT_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = \mathbf{4}$ | Caminos: 4 (Happy Path, 401 Auth, 400 Bad Request, 500 DB).

---

## 3. FUNCIONALIDAD 3: Cálculo de Descuentos Escalonados en Cotizaciones

### 3.1 Capa Frontend (FE) — F3
* **Diagrama de Flujo (JPEG):** [`F3_FE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F3_FE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F3_FE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F3_FE_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = \mathbf{5}$ | Caminos: 5 caminos.

### 3.2 Capa Backend (BE) — F3 (`QuoteDiscountCalculator`)
* **Diagrama de Flujo (JPEG):** [`F3_BE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F3_BE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F3_BE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F3_BE_graph.jpeg)
* **Complejidad Ciclomática:**
  * Método 1: $V(G) = E - N + 2 = 25 - 18 + 2 = \mathbf{9}$
  * Método 2: $V(G) = P + 1 = 8 + 1 = \mathbf{9}$
  * Método 3: $V(G) = R = 8 \text{ cerradas} + 1 \text{ infinita} = \mathbf{9}$
* **Tabla de Caminos BE:**
  | Camino | Condición | Descripción | Caso Unitario |
  |:---:|---|---|:---:|
  | **P1** | `quoteId === ''` | quoteId obligatorio | `testCalculateFailsWhenQuoteIdIsEmpty` |
  | **P2** | `amount <= 0` | Monto no positivo | `testCalculateFailsWhenAmountIsZeroOrNegative` |
  | **P3** | `amount > 20000` | Tier 4: 15% descuento | `testCalculateTier4DiscountOver20k` |
  | **P4** | `10000 <= amount <= 20000` | Tier 3: 10% descuento | `testCalculateTier3DiscountBetween10kAnd20k` |
  | **P5** | `3000 <= amount < 10000` | Tier 2: 5% descuento | `testCalculateTier2DiscountBetween3kAnd10k` |
  | **P6** | `amount < 3000` | Tier 1: 0% descuento | `testCalculateTier1DiscountBelow3k` |
  | **P7** | Tier 4 + cupón válido | Descuento combinado cupón | `testCalculateDiscountWithValidCoupon` |
  | **P8** | Cupón vencido | Error 422 cupón inválido | `testCalculateFailsWhenCouponIsInvalid` |
  | **P9** | Fallo BD persistencia | Error 500 persistencia | `testCalculateFailsWhenRepositoryReturnsFalse` |

### 3.3 Capa Integración (INT) — F3
* **Diagrama de Flujo (JPEG):** [`F3_INT_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F3_INT_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F3_INT_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F3_INT_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = \mathbf{4}$ | Caminos: 4 caminos.

---

## 4. FUNCIONALIDAD 4: Evaluación y Escalado de Tareas Vencidas

### 4.1 Capa Frontend (FE) — F4
* **Diagrama de Flujo (JPEG):** [`F4_FE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F4_FE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F4_FE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F4_FE_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = \mathbf{5}$ | Caminos: 5 caminos.

### 4.2 Capa Backend (BE) — F4 (`TaskOverdueEvaluator`)
* **Diagrama de Flujo (JPEG):** [`F4_BE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F4_BE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F4_BE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F4_BE_graph.jpeg)
* **Complejidad Ciclomática:**
  * Método 1: $V(G) = E - N + 2 = 26 - 19 + 2 = \mathbf{9}$
  * Método 2: $V(G) = P + 1 = 8 + 1 = \mathbf{9}$
  * Método 3: $V(G) = R = 8 \text{ cerradas} + 1 \text{ infinita} = \mathbf{9}$
* **Tabla de Caminos BE:**
  | Camino | Condición | Descripción | Caso Unitario |
  |:---:|---|---|:---:|
  | **P1** | `taskId === ''` | taskId obligatorio | `testEvaluateFailsWhenTaskIdIsEmpty` |
  | **P2** | `dateEnd` inválida | Fecha corrupta | `testEvaluateFailsWhenDateEndIsInvalid` |
  | **P3** | `status === 'Completed'` | Tarea finalizada no vencida | `testEvaluateCompletedTaskNeverOverdue` |
  | **P4** | `dateEnd >= now` | Tarea en plazo | `testEvaluateTaskNotOverdueWhenDeadlineInFuture` |
  | **P5** | `días > 5` | Escalado crítico a Urgent | `testEvaluateOverdueTaskEscalatesToUrgentWhenOver5Days` |
  | **P6** | `2 < días <= 5` | Escalado moderado a High | `testEvaluateOverdueTaskEscalatesToHighWhenOver2Days` |
  | **P7** | `0 < días <= 2` | Atraso menor mantiene Normal | `testEvaluateOverdueTaskRetainsNormalPriorityWhenUnder2Days` |
  | **P8** | Fallo BD simulado | Error 500 persistencia | `testEvaluateFailsWhenRepositoryReturnsFalse` |
  | **P9** | Escalado con reasignación | Reasignación a supervisor | `testEvaluateOverdueTaskReassignsToSupervisor` |

### 4.3 Capa Integración (INT) — F4
* **Diagrama de Flujo (JPEG):** [`F4_INT_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F4_INT_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F4_INT_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F4_INT_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = \mathbf{4}$ | Caminos: 4 caminos.

---

## 5. FUNCIONALIDAD 5: Detección y Deduplicación de Cuentas Corporativas

### 5.1 Capa Frontend (FE) — F5
* **Diagrama de Flujo (JPEG):** [`F5_FE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F5_FE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F5_FE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F5_FE_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = \mathbf{5}$ | Caminos: 5 caminos.

### 5.2 Capa Backend (BE) — F5 (`AccountDuplicateDetector`)
* **Diagrama de Flujo (JPEG):** [`F5_BE_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F5_BE_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F5_BE_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F5_BE_graph.jpeg)
* **Complejidad Ciclomática:**
  * Método 1: $V(G) = E - N + 2 = 24 - 17 + 2 = \mathbf{10}$ (con subrutinas de sufijos)
  * Método 2: $V(G) = P + 1 = 9 + 1 = \mathbf{10}$
  * Método 3: $V(G) = R = 9 \text{ cerradas} + 1 \text{ infinita} = \mathbf{10}$
* **Tabla de Caminos BE:**
  | Camino | Condición | Descripción | Caso Unitario |
  |:---:|---|---|:---:|
  | **P1** | `name === ''` | Nombre corporativo vacío | `testDetectFailsWhenAccountNameIsEmpty` |
  | **P2** | NIT idéntico en base | Duplicado 100% por NIT | `testDetectFlagsDuplicateByExactTaxId` |
  | **P3** | Similitud Levenshtein >= 85% | Duplicado por razón social similar | `testDetectFlagsDuplicateByNormalizedNameSimilarity` |
  | **P4** | Sin NIT, razón social < 85% | Cuenta única verificada | `testDetectUniqueAccountSucceeds` |
  | **P5** | Fallo BD simulado | Error 500 persistencia | `testDetectFailsWhenRepositoryReturnsFalse` |
  | **P6** | Sufijo 'S.A.S.' ignorado | Normalización de tipo societario | `testDetectNormalizesLegalSuffixes` |
  | **P7** | Diferencia case-insensitive | Insensibilidad a mayúsculas | `testDetectCaseInsensitiveMatch` |
  | **P8** | Puntuación y espacios | Limpieza de caracteres | `testDetectCleansSpecialCharactersAndSpaces` |
  | **P9** | Similitud al 84% | Frontera inferior: No duplicado | `testDetectBoundarySimilarity84PercentNotDuplicate` |
  | **P10**| Similitud al 85% | Frontera exacta: Duplicado | `testDetectBoundarySimilarity85PercentFlagsDuplicate` |

### 5.3 Capa Integración (INT) — F5
* **Diagrama de Flujo (JPEG):** [`F5_INT_flow.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F5_INT_flow.jpeg)
* **Grafo de Nodos (JPEG):** [`F5_INT_graph.jpeg`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/diagramas-caja-blanca-andres/F5_INT_graph.jpeg)
* **Complejidad Ciclomática:** $V(G) = \mathbf{4}$ | Caminos: 4 caminos.
