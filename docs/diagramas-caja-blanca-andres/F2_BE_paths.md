#### Tabla de Caminos de Prueba — Backend (F2: CaseSlaCalculator)

| Camino | Secuencia de Nodos | Condición de Activación | Descripción | Caso Unitario Cubierto |
|---|---|---|---|:---:|
| **P1** | Start → n1 → n2 → n3 → End | `caseId === ''` | Rechazo por caseId faltante | `testCalculateFailsWhenCaseIdIsEmpty` |
| **P2** | Start → n1 → n2 → n4 → n5 → End | `priority` inválida | Rechazo por prioridad desconocida | `testCalculateFailsWhenPriorityIsInvalid` |
| **P3** | Start → n1 → n2 → n4 → n6 → n7 → End | `createdAt` inválida | Rechazo por formato de fecha no parseable | `testCalculateFailsWhenCreatedAtIsInvalid` |
| **P4** | Start → n1 → n2 → n4 → n6 → n8 → n9 → n10 → n12 → n13 → n14 → n16 → n17 → n19 → End | Tier cuenta Premium, horario hábil, BD OK | SLA Urgente con cálculo hábil (Happy Path) | `testCalculateSlaUrgentWithPremiumAccount` |
| **P5** | Start → n1 → n2 → n4 → n6 → n8 → n9 → n11 → n12 → n13 → n15 → n16 → n17 → n19 → End | Tier Standard fallback, 24/7 corrido | SLA Normal estándar 24 horas | `testCalculateSlaNormalWithStandardAccount` |
| **P6** | Start → n1 → n2 → n4 → n6 → n8 → n9 → n11 → n12 → n13 → n14 → n16 → n17 → n18 → End | Cálculo correcto, fallo en BD | Error 500 por fallo de almacenamiento | `testCalculateFailsWhenRepositoryReturnsFalse` |
| **P7** | Start → n1 → n2 → n4 → n6 → n8 → n9 → n10 → n12(High) → n16 → n17 → n19 → End | Prioridad High (8h SLA) | Variación de plazo para casos High | `testCalculateSlaHighPriority` |
| **P8** | Start → n1 → n2 → n4 → n6 → n8 → n9 → n10 → n12(Low) → n16 → n17 → n19 → End | Prioridad Low (72h SLA) | Variación de plazo para casos Low | `testCalculateSlaLowPriority` |
| **P9** | Start → n1 → n2 → n4 → n6 → n8 → n9 → n10 → n12 → n13(Weekend) → n16 → n19 → End | Creación en viernes por la tarde | Salto determinista de fin de semana | `testCalculateSlaSkipsWeekendHours` |
| **P10**| Start → n1 → n2 → n4 → n6 → n8 → n9 → n10 → n12 → n13(Holiday) → n16 → n19 → End | Creación en día festivo | Inclusión de calendario laboral | `testCalculateSlaHandlesHolidays` |
| **P11**| Start → n1 → n2 → n4 → n6 → n8 → n9 → n10 → n12(Overdue) → n16 → n19 → End | Caso con tiempo vencido detectado | Marcado de breach de SLA | `testCalculateSlaFlagsBreachedStatus` |

| Métrica | Valor |
|---|---|
| Caminos Definidos | 11 |
| Complejidad $V(G)$ | 11 |
| Cobertura Branch | 100% |
