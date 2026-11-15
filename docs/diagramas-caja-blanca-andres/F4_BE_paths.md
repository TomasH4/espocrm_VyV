#### Tabla de Caminos de Prueba — Backend (F4: TaskOverdueEvaluator)

| Camino | Secuencia de Nodos | Condición de Activación | Descripción | Caso Unitario Cubierto |
|---|---|---|---|:---:|
| **P1** | Start → n1 → n2 → n3 → End | `taskId === ''` | Rechazo por taskId faltante | `testEvaluateFailsWhenTaskIdIsEmpty` |
| **P2** | Start → n1 → n2 → n4 → n5 → End | `dateEnd` inválida | Rechazo por fecha malformada | `testEvaluateFailsWhenDateEndIsInvalid` |
| **P3** | Start → n1 → n2 → n4 → n6 → n7 → End | `status === 'Completed'` | Tarea finalizada, exenta de escalado | `testEvaluateCompletedTaskNeverOverdue` |
| **P4** | Start → n1 → n2 → n4 → n6 → n8 → n9 → End | `dateEnd >= now` | Tarea en plazo vigente | `testEvaluateTaskNotOverdueWhenDeadlineInFuture` |
| **P5** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n11 → n15 → n16 → n18 → End | `días > 5` | Escalado crítico a prioridad Urgent | `testEvaluateOverdueTaskEscalatesToUrgentWhenOver5Days` |
| **P6** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n12 → n13 → n15 → n16 → n18 → End | `2 < días <= 5` | Escalado moderado a prioridad High | `testEvaluateOverdueTaskEscalatesToHighWhenOver2Days` |
| **P7** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n12 → n14 → n15 → n16 → n18 → End | `0 < días <= 2` | Atraso menor manteniendo prioridad Normal | `testEvaluateOverdueTaskRetainsNormalPriorityWhenUnder2Days` |
| **P8** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n11 → n15 → n16 → n17 → End | Fallo simulado en BD | Error interno 500 por base de datos | `testEvaluateFailsWhenRepositoryReturnsFalse` |
| **P9** | Start → n1 → n2 → n4 → n6 → n8 → n10 → n11 → n15(Reassign) → n16 → n18 → End | Escalado con reasignación a supervisor | Reasignación automática de tarea crítica | `testEvaluateOverdueTaskReassignsToSupervisor` |

| Métrica | Valor |
|---|---|
| Caminos Definidos | 9 |
| Complejidad $V(G)$ | 9 |
| Cobertura Branch | 100% |
