#### Tabla de Caminos de Prueba — Backend (F1: CaseStatusTransitionValidator)

| Camino | Secuencia de Nodos | Condición de Activación | Descripción | Caso Unitario Cubierto |
|---|---|---|---|:---:|
| **P1** | Start → n1 → n2 → n3 → End | `caseId === ''` | Rechazo por identificador vacío | `testTransitionFailsWhenCaseIdIsEmpty` |
| **P2** | Start → n1 → n2 → n4 → n5 → End | `targetStatus` desconocido | Rechazo por estado destino no existente | `testTransitionFailsWhenTargetStatusIsInvalid` |
| **P3** | Start → n1 → n2 → n4 → n6 → n7 → End | `currentStatus === targetStatus` | Rechazo por transición redundante | `testTransitionFailsWhenCurrentAndTargetAreIdentical` |
| **P4** | Start → n1 → n2 → n4 → n6 → n8 → n9 → End | `currentStatus === 'Rejected'` | Inmutabilidad de caso rechazado | `testTransitionFailsWhenCurrentStatusIsRejected` |
| **P5** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n11 → n12 → End | `currentStatus === 'Closed'`, resolución < 15 chars | Rechazo por reapertura sin justificación | `testTransitionFailsWhenReopeningClosedCaseWithoutJustification` |
| **P6** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n11 → n15 → n16 → End | `currentStatus === 'Closed'`, reapertura sin responsable | Rechazo por falta de usuario asignado en reapertura | `testTransitionFailsWhenReopeningWithoutAssignedUser` |
| **P7** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n13 → n14 → End | Salto ilegal (New a Closed) | Rechazo por violación de flujo permitido | `testTransitionFailsWhenIllegalTransitionFromNewToClosed` |
| **P8** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n13 → n15 → n16 → End | New a Assigned sin responsable | Rechazo por asignación incompleta | `testTransitionFailsWhenAssignedUserIdIsMissing` |
| **P9** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n13 → n15 → n17 → n18 → n19 → End | Transición válida, fallo simulado en BD | Error interno 500 por base de datos | `testTransitionFailsWhenRepositoryReturnsFalse` |
| **P10**| Start → n1 → n2 → n4 → n6 → n8 → n10 → n13 → n15 → n17 → n18 → n20 → End | Transición válida, responsable y BD exitosa | Happy Path de transición de estado | `testTransitionSucceedsWithValidParameters` |

| Métrica | Valor |
|---|---|
| Caminos Definidos | 10 |
| Complejidad $V(G)$ | 10 |
| Cobertura Branch | 100% |
