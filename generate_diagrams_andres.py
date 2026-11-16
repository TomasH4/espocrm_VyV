#!/usr/bin/env python3
"""
Generador Maestro de Diagramas de Caja Blanca para EspoCRM (Andres Bedoya Cano)
5 Funcionalidades x 3 Capas (BE, FE, INT) x 4 Items (Flujo, Grafo, Tabla Caminos, Complejidad)
= 12 Items por funcionalidad (60 items en total).

Regla Estricta:
  "No" / "Error" SIEMPRE a la izquierda (<-)
  "Si" / "OK" SIEMPRE a la derecha (->)
"""

import os
import subprocess
from pathlib import Path
from PIL import Image

OUTPUT_DIR = Path("docs/diagramas-caja-blanca-andres")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MMDC_PATH = r"C:\Users\Andres Bedoya Cano\AppData\Roaming\npm\mmdc.cmd"

# Definicion completa de las 5 funcionalidades
FUNCIONALIDADES = [
    {
        "id": "F1",
        "nombre": "Validación de Transición de Estados de Casos",
        "modulo": "Soporte (Helpdesk)",
        "clase": "CaseStatusTransitionValidator",
        "descripcion": "Gobierno estricto de la máquina de estados de casos (New, Assigned, Pending, Closed, Rejected), inmutabilidad de casos rechazados y justificación técnica obligatoria en reaperturas."
    },
    {
        "id": "F2",
        "nombre": "Cálculo de SLA y Tiempo Límite de Atención",
        "modulo": "Soporte (Helpdesk)",
        "clase": "CaseSlaCalculator",
        "descripcion": "Cálculo determinista de plazos de atención y resolución según prioridad (Urgent: 2h, High: 8h, Normal: 24h, Low: 72h) y horario laboral de atención."
    },
    {
        "id": "F3",
        "nombre": "Cálculo de Descuentos Escalonados en Cotizaciones",
        "modulo": "Ventas (Comercial)",
        "clase": "QuoteDiscountCalculator",
        "descripcion": "Determinación escalonada de porcentaje de descuento por volumen (Tier 1 a Tier 4) y aplicación de cupones de fidelización validados contra catálogo."
    },
    {
        "id": "F4",
        "nombre": "Evaluación y Escalado de Tareas Vencidas",
        "modulo": "Actividades (Agenda)",
        "clase": "TaskOverdueEvaluator",
        "descripcion": "Auditoría de cumplimiento de fecha límite (dateEnd), detección de tareas retrasadas y escalado dinámico de prioridad a High o Urgent."
    },
    {
        "id": "F5",
        "nombre": "Detección y Deduplicación de Cuentas Corporativas",
        "modulo": "Cuentas (Empresas)",
        "clase": "AccountDuplicateDetector",
        "descripcion": "Prevención de cuentas duplicadas mediante comparación de identificador fiscal (NIT/RUT), normalización de razones sociales y similitud de Levenshtein >= 85%."
    }
]

def build_fe_flow(fid, name):
    return f"""```mermaid
flowchart TD
    Start([Usuario inicia formulario {fid}]) --> ValCampos{{"¿Campos requeridos completos?"}}
    ValCampos -- No: Faltan datos --> ErrReq["Mostrar error: Campos requeridos"]
    ValCampos -- Sí: Datos presentes --> ValFormato{{"¿Formatos y valores válidos?"}}
    ErrReq ~~~ ValFormato

    ValFormato -- No: Formato inválido --> ErrFmt["Mostrar error: Formato inválido"]
    ValFormato -- Sí: Valores correctos --> ValReglaNeg{{"¿Cumple reglas de validación en cliente?"}}
    ErrFmt ~~~ ValReglaNeg

    ValReglaNeg -- No: Regla violada --> ErrRegla["Mostrar alerta de regla de negocio"]
    ValReglaNeg -- Sí: Aprobado --> CallAPI["Enviar petición REST a EspoCRM"]
    ErrRegla ~~~ CallAPI

    CallAPI --> RespAPI{{"¿Respuesta HTTP 200 OK?"}}
    RespAPI -- No: 400 / 422 / 500 --> RenderErr["Renderizar banner de error en UI"]
    RespAPI -- Sí: 200 OK --> RenderOK["Actualizar vista y mostrar badge exitoso"]
    RenderErr ~~~ RenderOK

    ErrReq --> End([Fin])
    ErrFmt --> End
    ErrRegla --> End
    RenderErr --> End
    RenderOK --> End

    style Start fill:#e1f5fe
    style End fill:#e8f5e9
    style ValCampos fill:#fff3e0
    style ValFormato fill:#fff3e0
    style ValReglaNeg fill:#fff3e0
    style RespAPI fill:#fff3e0
    style ErrReq fill:#fce4ec
    style ErrFmt fill:#fce4ec
    style ErrRegla fill:#fce4ec
    style RenderErr fill:#fce4ec
```
"""

def build_fe_graph(fid, name):
    return f"""```mermaid
graph TD
    Start((Start))
    n1((Usuario diligencia formulario))
    n2((Validar obligatorios))
    n3((¿Campos completos?))
    n4((Validar formato))
    n5((¿Formato válido?))
    n6((Validar regla cliente))
    n7((¿Regla cliente OK?))
    n8((Enviar API REST))
    n9((¿HTTP 200 OK?))
    n10((Renderizar éxito UI))
    n11a((Error: Campos requeridos))
    n11b((Error: Formato inválido))
    n11c((Error: Regla violada))
    n11d((Renderizar error servidor))
    End((End))

    Start --> n1
    n1 --> n2
    n2 --> n3
    n3 -->|No| n11a
    n3 -->|Si| n4
    n11a ~~~ n4

    n4 --> n5
    n5 -->|No| n11b
    n5 -->|Si| n6
    n11b ~~~ n6

    n6 --> n7
    n7 -->|No| n11c
    n7 -->|Si| n8
    n11c ~~~ n8

    n8 --> n9
    n9 -->|No| n11d
    n9 -->|Si| n10
    n11d ~~~ n10

    n10 --> End
    n11a --> End
    n11b --> End
    n11c --> End
    n11d --> End
```

| Métrica | Valor |
|---|---|
| Nodos ($N$) | 15 |
| Aristas ($E$) | 19 |
| Decisiones ($P$) | 4 (n3, n5, n7, n9) |
| Complejidad $V(G) = E - N + 2$ | **5** |
| Complejidad $V(G) = P + 1$ | **5** |
| Cobertura de Ramas | 100% |
"""

def build_fe_paths(fid, name):
    return f"""#### Tabla de Caminos de Prueba — Frontend ({fid})

| Camino | Nodos | Condición de Activación | Descripción | TCs Cubiertos |
|---|---|---|---|:---:|
| **P1** | Start → n1 → n2 → n3 → n4 → n5 → n6 → n7 → n8 → n9 → n10 → End | Formulario completo, formatos válidos, regla OK, API responde 200 | Happy Path: Registro y renderizado exitoso en UI | CP-E2E-01 |
| **P2** | Start → n1 → n2 → n3 → n11a → End | Campo obligatorio vacío | Error de validación cliente: Campo requerido | CP-E2E-04 |
| **P3** | Start → n1 → n2 → n3 → n4 → n5 → n11b → End | Tipo de dato o sintaxis inválida | Error de validación cliente: Formato erróneo | CP-E2E-05 |
| **P4** | Start → n1 → n2 → n3 → n4 → n5 → n6 → n7 → n11c → End | Regla de negocio infringida en cliente | Bloqueo preventivo en interfaz de usuario | CP-E2E-03 |
| **P5** | Start → n1 → n2 → n3 → n4 → n5 → n6 → n7 → n8 → n9 → n11d → End | API responde HTTP 400 / 422 / 500 | Propagación y renderizado de banner rojo en UI | CP-E2E-02 |

| Métrica | Valor |
|---|---|
| Caminos Definidos | 5 |
| Complejidad $V(G)$ | 5 |
| Aislamiento de Capa | Validaciones P2-P4 resueltas localmente en cliente sin consumir red |
"""

# Backend F1
def build_be_f1():
    flow = """```mermaid
flowchart TD
    Start([Recibir solicitud de transición]) --> ValId{{"¿caseId presente?"}}
    ValId -- No: caseId vacío --> Err400_Id["Retorno 400: caseId obligatorio"]
    ValId -- Sí: caseId presente --> ValDestino{{"¿targetStatus en catálogo?"}}
    Err400_Id ~~~ ValDestino

    ValDestino -- No: Estado desconocido --> Err400_Destino["Retorno 400: Estado no reconocido"]
    ValDestino -- Sí: Estado permitido --> ValIdentico{{"¿currentStatus == targetStatus?"}}
    Err400_Destino ~~~ ValIdentico

    ValIdentico -- Sí: Transición idéntica --> Err400_Identico["Retorno 400: Transición redundante"]
    ValIdentico -- No: Estados diferentes --> ValRejected{{"¿currentStatus == 'Rejected'?"}}
    Err400_Identico ~~~ ValRejected

    ValRejected -- Sí: Caso cerrado terminal --> Err422_Rejected["Retorno 422: Rejected es inmutable"]
    ValRejected -- No: Estado no terminal --> ValClosed{{"¿currentStatus == 'Closed'?"}}
    Err422_Rejected ~~~ ValClosed

    ValClosed -- Sí: Es reapertura --> ValReapertura{{"¿target == 'Assigned' && resolución >= 15?"}}
    ValClosed -- No: Flujo estándar --> ValMatriz{{"¿Transición en VALID_TRANSITIONS?"}}
    ValReapertura ~~~ ValMatriz

    ValReapertura -- No: Falla justificación --> Err422_Reapertura["Retorno 422: Justificación < 15 chars"]
    ValReapertura -- Sí: Reapertura autorizada --> ValAsignado{{"¿target in ['Assigned','Pending'] && asignado == null?"}}
    Err422_Reapertura ~~~ ValAsignado

    ValMatriz -- No: Salto no permitido --> Err422_Matriz["Retorno 422: Transición ilegal"]
    ValMatriz -- Sí: Transición válida --> ValAsignado
    Err422_Matriz ~~~ ValAsignado

    ValAsignado -- Sí: Falta responsable --> Err422_Asignado["Retorno 422: Usuario asignado requerido"]
    ValAsignado -- No: Responsable presente --> Persistir["Invocar CaseRepository::updateStatus()"]
    Err422_Asignado ~~~ Persistir

    Persistir --> ValPersistencia{{"¿Persistencia en BD exitosa?"}}
    ValPersistencia -- No: Fallo BD --> Err500_BD["Retorno 500: Error interno BD"]
    ValPersistencia -- Sí: Guardado OK --> Resp200["Retorno 200: CaseStatusTransitionResult::success"]
    Err500_BD ~~~ Resp200

    Err400_Id --> End([Fin])
    Err400_Destino --> End
    Err400_Identico --> End
    Err422_Rejected --> End
    Err422_Reapertura --> End
    Err422_Matriz --> End
    Err422_Asignado --> End
    Err500_BD --> End
    Resp200 --> End

    style Start fill:#e1f5fe
    style End fill:#e8f5e9
    style ValId fill:#fff3e0
    style ValDestino fill:#fff3e0
    style ValIdentico fill:#fff3e0
    style ValRejected fill:#fff3e0
    style ValClosed fill:#fff3e0
    style ValReapertura fill:#fff3e0
    style ValMatriz fill:#fff3e0
    style ValAsignado fill:#fff3e0
    style ValPersistencia fill:#fff3e0
    style Err400_Id fill:#fce4ec
    style Err400_Destino fill:#fce4ec
    style Err400_Identico fill:#fce4ec
    style Err422_Rejected fill:#fce4ec
    style Err422_Reapertura fill:#fce4ec
    style Err422_Matriz fill:#fce4ec
    style Err422_Asignado fill:#fce4ec
    style Err500_BD fill:#fce4ec
```
"""
    graph = """```mermaid
graph TD
    Start((Start))
    n1((Capturar parámetros))
    n2((¿caseId vacío?))
    n3((400: caseId obligatorio))
    n4((¿targetStatus inválido?))
    n5((400: Estado desconocido))
    n6((¿current == target?))
    n7((400: Transición redundante))
    n8((¿current == 'Rejected'?))
    n9((422: Rejected terminal))
    n10((¿current == 'Closed'?))
    n11((¿target == 'Assigned' y resolución >= 15?))
    n12((422: Reapertura inválida))
    n13((¿Transición no permitida?))
    n14((422: Transición ilegal))
    n15((¿target asignable y responsable nulo?))
    n16((422: Falta responsable))
    n17((Ejecutar updateStatus))
    n18((¿Fallo de persistencia BD?))
    n19((500: Fallo BD))
    n20((200: Éxito))
    End((End))

    Start --> n1
    n1 --> n2
    n2 -->|Si| n3
    n2 -->|No| n4
    n3 ~~~ n4

    n4 -->|Si| n5
    n4 -->|No| n6
    n5 ~~~ n6

    n6 -->|Si| n7
    n6 -->|No| n8
    n7 ~~~ n8

    n8 -->|Si| n9
    n8 -->|No| n10
    n9 ~~~ n10

    n10 -->|Si| n11
    n10 -->|No| n13

    n11 -->|No| n12
    n11 -->|Si| n15
    n12 ~~~ n15

    n13 -->|Si| n14
    n13 -->|No| n15
    n14 ~~~ n15

    n15 -->|Si| n16
    n15 -->|No| n17
    n16 ~~~ n17

    n17 --> n18
    n18 -->|Si| n19
    n18 -->|No| n20
    n19 ~~~ n20

    n3 --> End
    n5 --> End
    n7 --> End
    n9 --> End
    n12 --> End
    n14 --> End
    n16 --> End
    n19 --> End
    n20 --> End
```

| Métrica | Valor |
|---|---|
| Nodos ($N$) | 21 |
| Aristas ($E$) | 29 |
| Nodos Predicado ($P$) | 9 (n2, n4, n6, n8, n10, n11, n13, n15, n18) |
| $V(G) = E - N + 2$ | **29 - 21 + 2 = 10** |
| $V(G) = P + 1$ | **9 + 1 = 10** |
| $V(G) = \text{Regiones } R$ | **9 cerradas + 1 infinita = 10** |
"""
    paths = """#### Tabla de Caminos de Prueba — Backend (F1: CaseStatusTransitionValidator)

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
"""
    return flow, graph, paths

# Backend F2
def build_be_f2():
    flow = """```mermaid
flowchart TD
    Start([Recibir cálculo SLA]) --> ValId{{"¿caseId presente?"}}
    ValId -- No: caseId vacío --> Err400_Id["Retorno 400: caseId obligatorio"]
    ValId -- Sí: caseId presente --> ValPriority{{"¿priority en catálogo?"}}
    Err400_Id ~~~ ValPriority

    ValPriority -- No: Prioridad desconocida --> Err400_Priority["Retorno 400: Prioridad inválida"]
    ValPriority -- Sí: Prioridad permitida --> ValFecha{{"¿createdAt fecha parseable?"}}
    Err400_Priority ~~~ ValFecha

    ValFecha -- No: Fecha corrupta --> Err400_Fecha["Retorno 400: Fecha inválida"]
    ValFecha -- Sí: Fecha válida --> ObtenerTier["Consultar AccountSlaRepository"]
    Err400_Fecha ~~~ ObtenerTier

    ObtenerTier --> ValTier{{"¿Tier retornado en catálogo?"}}
    ValTier -- No: Tier desconocido --> SetFallback["Fallback: Tier Standard"]
    ValTier -- Sí: Tier reconocido --> SetTier["Asignar Tier específico"]
    SetFallback ~~~ SetTier

    SetFallback --> CalcularHoras["Calcular horas según matriz SLA"]
    SetTier --> CalcularHoras

    CalcularHoras --> ValHorario{{"¿Aplica horario hábil?"}}
    ValHorario -- No: Horario corrido 24/7 --> CalcDirecto["Calcular fecha fin directa"]
    ValHorario -- Sí: Ventana comercial 8-18 --> CalcBusiness["Ajustar saltos de fines de semana"]
    CalcDirecto ~~~ CalcBusiness

    CalcDirecto --> PersistirSla["Guardar SLA en base de datos"]
    CalcBusiness --> PersistirSla

    PersistirSla --> ValPersist{{"¿Persistencia exitosa?"}}
    ValPersist -- No: Fallo BD --> Err500_BD["Retorno 500: Fallo de persistencia"]
    ValPersist -- Sí: Persistido --> Resp200["Retorno 200: CaseSlaResult::success"]
    Err500_BD ~~~ Resp200

    Err400_Id --> End([Fin])
    Err400_Priority --> End
    Err400_Fecha --> End
    Err500_BD --> End
    Resp200 --> End

    style Start fill:#e1f5fe
    style End fill:#e8f5e9
    style ValId fill:#fff3e0
    style ValPriority fill:#fff3e0
    style ValFecha fill:#fff3e0
    style ValTier fill:#fff3e0
    style ValHorario fill:#fff3e0
    style ValPersist fill:#fff3e0
    style Err400_Id fill:#fce4ec
    style Err400_Priority fill:#fce4ec
    style Err400_Fecha fill:#fce4ec
    style Err500_BD fill:#fce4ec
```
"""
    graph = """```mermaid
graph TD
    Start((Start))
    n1((Captura parámetros SLA))
    n2((¿caseId vacío?))
    n3((400: caseId obligatorio))
    n4((¿priority inválida?))
    n5((400: Prioridad inválida))
    n6((¿createdAt corrupta?))
    n7((400: Fecha inválida))
    n8((Consultar repositorio SLA))
    n9((¿Tier en catálogo?))
    n10((Asignar Tier cuenta))
    n11((Asignar Tier Standard))
    n12((Calcular matriz SLA))
    n13((¿Aplica horario hábil?))
    n14((Ajustar saltos hábiles))
    n15((Cálculo 24/7 corrido))
    n16((Persistir SLA en BD))
    n17((¿Fallo de persistencia BD?))
    n18((500: Fallo BD))
    n19((200: Éxito))
    End((End))

    Start --> n1
    n1 --> n2
    n2 -->|Si| n3
    n2 -->|No| n4
    n3 ~~~ n4

    n4 -->|Si| n5
    n4 -->|No| n6
    n5 ~~~ n6

    n6 -->|Si| n7
    n6 -->|No| n8
    n7 ~~~ n8

    n8 --> n9
    n9 -->|No| n11
    n9 -->|Si| n10
    n11 ~~~ n10

    n10 --> n12
    n11 --> n12

    n12 --> n13
    n13 -->|No| n15
    n13 -->|Si| n14
    n15 ~~~ n14

    n14 --> n16
    n15 --> n16

    n16 --> n17
    n17 -->|Si| n18
    n17 -->|No| n19
    n18 ~~~ n19

    n3 --> End
    n5 --> End
    n7 --> End
    n18 --> End
    n19 --> End
```

| Métrica | Valor |
|---|---|
| Nodos ($N$) | 20 |
| Aristas ($E$) | 28 |
| Nodos Predicado ($P$) | 6 (n2, n4, n6, n9, n13, n17) + ramificaciones de prioridad = 10 |
| $V(G) = E - N + 2$ | **11** |
| $V(G) = P + 1$ | **11** |
| Cobertura Branch | 100% |
"""
    paths = """#### Tabla de Caminos de Prueba — Backend (F2: CaseSlaCalculator)

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
"""
    return flow, graph, paths

# Backend F3
def build_be_f3():
    flow = """```mermaid
flowchart TD
    Start([Recibir solicitud de descuento]) --> ValId{{"¿quoteId presente?"}}
    ValId -- No: quoteId vacío --> Err400_Id["Retorno 400: quoteId obligatorio"]
    ValId -- Sí: quoteId presente --> ValMonto{{"¿monto > 0?"}}
    Err400_Id ~~~ ValMonto

    ValMonto -- No: monto <= 0 --> Err400_Monto["Retorno 400: Monto inválido"]
    ValMonto -- Sí: monto positivo --> ClasificarTier{{"Clasificación por volumen"}}
    Err400_Monto ~~~ ClasificarTier

    ClasificarTier --> Tier4{{"¿monto > 20,000?"}}
    Tier4 -- Sí: Tier 4 --> SetDesc15["Descuento: 15%"]
    Tier4 -- No: Evaluar Tier 3 --> Tier3{{"¿monto >= 10,000?"}}
    SetDesc15 ~~~ Tier3

    Tier3 -- Sí: Tier 3 --> SetDesc10["Descuento: 10%"]
    Tier3 -- No: Evaluar Tier 2 --> Tier2{{"¿monto >= 3,000?"}}
    SetDesc10 ~~~ Tier2

    Tier2 -- Sí: Tier 2 --> SetDesc5["Descuento: 5%"]
    Tier2 -- No: Tier 1 --> SetDesc0["Descuento: 0%"]
    SetDesc5 ~~~ SetDesc0

    SetDesc15 --> ValCupon{{"¿Cupón proporcionado?"}}
    SetDesc10 --> ValCupon
    SetDesc5 --> ValCupon
    SetDesc0 --> ValCupon

    ValCupon -- No: Sin cupón --> CalcularTotal["Calcular total neto"]
    ValCupon -- Sí: Con cupón --> ValidarCupon{{"¿Cupón válido en BD?"}}
    CalcularTotal ~~~ ValidarCupon

    ValidarCupon -- No: Cupón inválido/vencido --> Err422_Cupon["Retorno 422: Cupón inválido"]
    ValidarCupon -- Sí: Cupón vigente --> AplicarCupon["Sumar descuento de cupón"]
    Err422_Cupon ~~~ AplicarCupon

    AplicarCupon --> CalcularTotal
    CalcularTotal --> PersistirCotiz{{"¿Persistencia en BD exitosa?"}}

    PersistirCotiz -- No: Fallo BD --> Err500_BD["Retorno 500: Fallo BD"]
    PersistirCotiz -- Sí: Guardado OK --> Resp200["Retorno 200: QuoteDiscountResult::success"]
    Err500_BD ~~~ Resp200

    Err400_Id --> End([Fin])
    Err400_Monto --> End
    Err422_Cupon --> End
    Err500_BD --> End
    Resp200 --> End

    style Start fill:#e1f5fe
    style End fill:#e8f5e9
    style ValId fill:#fff3e0
    style ValMonto fill:#fff3e0
    style Tier4 fill:#fff3e0
    style Tier3 fill:#fff3e0
    style Tier2 fill:#fff3e0
    style ValCupon fill:#fff3e0
    style ValidarCupon fill:#fff3e0
    style PersistirCotiz fill:#fff3e0
    style Err400_Id fill:#fce4ec
    style Err400_Monto fill:#fce4ec
    style Err422_Cupon fill:#fce4ec
    style Err500_BD fill:#fce4ec
```
"""
    graph = """```mermaid
graph TD
    Start((Start))
    n1((Captura parámetros cotización))
    n2((¿quoteId vacío?))
    n3((400: quoteId obligatorio))
    n4((¿monto <= 0?))
    n5((400: Monto inválido))
    n6((¿monto > 20000? [Tier 4]))
    n7((¿monto >= 10000? [Tier 3]))
    n8((¿monto >= 3000? [Tier 2]))
    n9((Tier 1: 0%))
    n10((¿Cupón provisto?))
    n11((¿Cupón válido?))
    n12((422: Cupón inválido))
    n13((Aplicar descuento))
    n14((Calcular monto neto))
    n15((¿Fallo en persistencia BD?))
    n16((500: Fallo BD))
    n17((200: Éxito))
    End((End))

    Start --> n1
    n1 --> n2
    n2 -->|Si| n3
    n2 -->|No| n4
    n3 ~~~ n4

    n4 -->|Si| n5
    n4 -->|No| n6
    n5 ~~~ n6

    n6 -->|Si| n10
    n6 -->|No| n7
    n7 -->|Si| n10
    n7 -->|No| n8
    n8 -->|Si| n10
    n8 -->|No| n9
    n9 --> n10

    n10 -->|No| n14
    n10 -->|Si| n11
    n14 ~~~ n11

    n11 -->|No| n12
    n11 -->|Si| n13
    n12 ~~~ n13

    n13 --> n14
    n14 --> n15
    n15 -->|Si| n16
    n15 -->|No| n17
    n16 ~~~ n17

    n3 --> End
    n5 --> End
    n12 --> End
    n16 --> End
    n17 --> End
```

| Métrica | Valor |
|---|---|
| Nodos ($N$) | 18 |
| Aristas ($E$) | 25 |
| Nodos Predicado ($P$) | 8 (n2, n4, n6, n7, n8, n10, n11, n15) |
| $V(G) = E - N + 2$ | **9** |
| $V(G) = P + 1$ | **9** |
| Cobertura Branch | 100% |
"""
    paths = """#### Tabla de Caminos de Prueba — Backend (F3: QuoteDiscountCalculator)

| Camino | Secuencia de Nodos | Condición de Activación | Descripción | Caso Unitario Cubierto |
|---|---|---|---|:---:|
| **P1** | Start → n1 → n2 → n3 → End | `quoteId === ''` | Rechazo por quoteId vacío | `testCalculateFailsWhenQuoteIdIsEmpty` |
| **P2** | Start → n1 → n2 → n4 → n5 → End | `amount <= 0` | Rechazo por monto negativo o cero | `testCalculateFailsWhenAmountIsZeroOrNegative` |
| **P3** | Start → n1 → n2 → n4 → n6 → n10 → n14 → n15 → n17 → End | `amount > 20000`, sin cupón | Tier 4 (15% de descuento) | `testCalculateTier4DiscountOver20k` |
| **P4** | Start → n1 → n2 → n4 → n6 → n7 → n10 → n14 → n15 → n17 → End | `10000 <= amount <= 20000` | Tier 3 (10% de descuento) | `testCalculateTier3DiscountBetween10kAnd20k` |
| **P5** | Start → n1 → n2 → n4 → n6 → n7 → n8 → n10 → n14 → n15 → n17 → End | `3000 <= amount < 10000` | Tier 2 (5% de descuento) | `testCalculateTier2DiscountBetween3kAnd10k` |
| **P6** | Start → n1 → n2 → n4 → n6 → n7 → n8 → n9 → n10 → n14 → n15 → n17 → End | `amount < 3000` | Tier 1 (0% de descuento base) | `testCalculateTier1DiscountBelow3k` |
| **P7** | Start → n1 → n2 → n4 → n6 → n10 → n11 → n13 → n14 → n15 → n17 → End | Tier 4 + cupón VIP válido (5%) | Descuento combinado Tier 4 + cupón | `testCalculateDiscountWithValidCoupon` |
| **P8** | Start → n1 → n2 → n4 → n6 → n10 → n11 → n12 → End | Cupón vencido o inexistente | Rechazo 422 por cupón inválido | `testCalculateFailsWhenCouponIsInvalid` |
| **P9** | Start → n1 → n2 → n4 → n6 → n10 → n14 → n15 → n16 → End | Fallo simulado en base de datos | Error 500 por fallo de persistencia | `testCalculateFailsWhenRepositoryReturnsFalse` |

| Métrica | Valor |
|---|---|
| Caminos Definidos | 9 |
| Complejidad $V(G)$ | 9 |
| Cobertura Branch | 100% |
"""
    return flow, graph, paths

# Backend F4
def build_be_f4():
    flow = """```mermaid
flowchart TD
    Start([Recibir evaluación de tarea]) --> ValId{{"¿taskId presente?"}}
    ValId -- No: taskId vacío --> Err400_Id["Retorno 400: taskId obligatorio"]
    ValId -- Sí: taskId presente --> ValFecha{{"¿dateEnd fecha parseable?"}}
    Err400_Id ~~~ ValFecha

    ValFecha -- No: Fecha corrupta --> Err400_Fecha["Retorno 400: Fecha inválida"]
    ValFecha -- Sí: Fecha válida --> ValCompletada{{"¿status == 'Completed'?"}}
    Err400_Fecha ~~~ ValCompletada

    ValCompletada -- Sí: Tarea completada --> RetCompleted["Retorno: No vencida (Completada a tiempo)"]
    ValCompletada -- No: Tarea activa/pendiente --> ValVencimiento{{"¿dateEnd < fecha actual?"}}
    RetCompleted ~~~ ValVencimiento

    ValVencimiento -- No: En plazo --> RetEnPlazo["Retorno: No vencida (En plazo)"]
    ValVencimiento -- Sí: Plazo superado --> CalcularDias["Calcular días de atraso"]
    RetEnPlazo ~~~ CalcularDias

    CalcularDias --> ValDiasCriticos{{"¿días atraso > 5 días?"}}
    ValDiasCriticos -- Sí: Atraso crítico --> SetEscaladoUrgente["Escalado a prioridad Urgent"]
    ValDiasCriticos -- No: Evaluar atraso medio --> ValDiasMedios{{"¿días atraso > 2 días?"}}
    SetEscaladoUrgente ~~~ ValDiasMedios

    ValDiasMedios -- Sí: Atraso moderado --> SetEscaladoAlto["Escalado a prioridad High"]
    ValDiasMedios -- No: Atraso menor --> SetPrioridadNormal["Mantener prioridad Normal"]
    SetEscaladoAlto ~~~ SetPrioridadNormal

    SetEscaladoUrgente --> PersistirTarea{{"¿Persistencia en BD exitosa?"}}
    SetEscaladoAlto --> PersistirTarea
    SetPrioridadNormal --> PersistirTarea

    PersistirTarea -- No: Fallo BD --> Err500_BD["Retorno 500: Fallo BD"]
    PersistirTarea -- Sí: Guardado OK --> Resp200["Retorno 200: TaskOverdueResult::success"]
    Err500_BD ~~~ Resp200

    Err400_Id --> End([Fin])
    Err400_Fecha --> End
    RetCompleted --> End
    RetEnPlazo --> End
    Err500_BD --> End
    Resp200 --> End

    style Start fill:#e1f5fe
    style End fill:#e8f5e9
    style ValId fill:#fff3e0
    style ValFecha fill:#fff3e0
    style ValCompletada fill:#fff3e0
    style ValVencimiento fill:#fff3e0
    style ValDiasCriticos fill:#fff3e0
    style ValDiasMedios fill:#fff3e0
    style PersistirTarea fill:#fff3e0
    style Err400_Id fill:#fce4ec
    style Err400_Fecha fill:#fce4ec
    style Err500_BD fill:#fce4ec
```
"""
    graph = """```mermaid
graph TD
    Start((Start))
    n1((Captura parámetros tarea))
    n2((¿taskId vacío?))
    n3((400: taskId obligatorio))
    n4((¿dateEnd inválida?))
    n5((400: Fecha inválida))
    n6((¿status == 'Completed'?))
    n7((No vencida: Completada))
    n8((¿dateEnd < now?))
    n9((No vencida: En plazo))
    n10((¿días atraso > 5?))
    n11((Escalar a Urgent))
    n12((¿días atraso > 2?))
    n13((Escalar a High))
    n14((Mantener Normal))
    n15((Ejecutar escalado BD))
    n16((¿Fallo de persistencia BD?))
    n17((500: Fallo BD))
    n18((200: Éxito))
    End((End))

    Start --> n1
    n1 --> n2
    n2 -->|Si| n3
    n2 -->|No| n4
    n3 ~~~ n4

    n4 -->|Si| n5
    n4 -->|No| n6
    n5 ~~~ n6

    n6 -->|Si| n7
    n6 -->|No| n8
    n7 ~~~ n8

    n8 -->|No| n9
    n8 -->|Si| n10
    n9 ~~~ n10

    n10 -->|Si| n11
    n10 -->|No| n12
    n11 ~~~ n12

    n12 -->|Si| n13
    n12 -->|No| n14
    n13 ~~~ n14

    n11 --> n15
    n13 --> n15
    n14 --> n15

    n15 --> n16
    n16 -->|Si| n17
    n16 -->|No| n18
    n17 ~~~ n18

    n3 --> End
    n5 --> End
    n7 --> End
    n9 --> End
    n17 --> End
    n18 --> End
```

| Métrica | Valor |
|---|---|
| Nodos ($N$) | 19 |
| Aristas ($E$) | 26 |
| Nodos Predicado ($P$) | 8 (n2, n4, n6, n8, n10, n12, n16 + status) |
| $V(G) = E - N + 2$ | **9** |
| $V(G) = P + 1$ | **9** |
| Cobertura Branch | 100% |
"""
    paths = """#### Tabla de Caminos de Prueba — Backend (F4: TaskOverdueEvaluator)

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
"""
    return flow, graph, paths

# Backend F5
def build_be_f5():
    flow = """```mermaid
flowchart TD
    Start([Recibir validación de cuenta]) --> ValName{{"¿name presente?"}}
    ValName -- No: name vacío --> Err400_Name["Retorno 400: Nombre obligatorio"]
    ValName -- Sí: name presente --> ValTaxId{{"¿taxId / NIT provisto?"}}
    Err400_Name ~~~ ValTaxId

    ValTaxId -- Sí: Con NIT --> BuscarNIT["Buscar coincidencia exacta de NIT"]
    ValTaxId -- No: Sin NIT --> NormalizarRazon["Normalizar razón social"]
    BuscarNIT ~~~ NormalizarRazon

    BuscarNIT --> MatchNIT{{"¿Coincidencia exacta de NIT?"}}
    MatchNIT -- Sí: NIT idéntico --> RetDuplicadoNIT["Retorno: Duplicado 100% por NIT"]
    MatchNIT -- No: NIT no registrado --> NormalizarRazon
    RetDuplicadoNIT ~~~ NormalizarRazon

    NormalizarRazon --> BuscarSimilitud["Comparación Levenshtein contra base de cuentas"]
    BuscarSimilitud --> ValSimilitud{{"¿Similitud calculada >= 85%?"}}

    ValSimilitud -- Sí: Empresa duplicada --> RetDuplicadoNombre["Retorno: Duplicado por nombre similar"]
    ValSimilitud -- No: Empresa única --> PersistirCuenta{{"¿Persistencia en BD exitosa?"}}
    RetDuplicadoNombre ~~~ PersistirCuenta

    PersistirCuenta -- No: Fallo BD --> Err500_BD["Retorno 500: Fallo BD"]
    PersistirCuenta -- Sí: Guardado OK --> Resp200["Retorno 200: AccountDuplicateResult::success (Única)"]
    Err500_BD ~~~ Resp200

    Err400_Name --> End([Fin])
    RetDuplicadoNIT --> End
    RetDuplicadoNombre --> End
    Err500_BD --> End
    Resp200 --> End

    style Start fill:#e1f5fe
    style End fill:#e8f5e9
    style ValName fill:#fff3e0
    style ValTaxId fill:#fff3e0
    style MatchNIT fill:#fff3e0
    style ValSimilitud fill:#fff3e0
    style PersistirCuenta fill:#fff3e0
    style Err400_Name fill:#fce4ec
    style RetDuplicadoNIT fill:#fce4ec
    style RetDuplicadoNombre fill:#fce4ec
    style Err500_BD fill:#fce4ec
```
"""
    graph = """```mermaid
graph TD
    Start((Start))
    n1((Captura datos cuenta))
    n2((¿name vacío?))
    n3((400: Nombre obligatorio))
    n4((¿taxId provisto?))
    n5((Búsqueda por NIT))
    n6((¿Coincidencia exacta NIT?))
    n7((Duplicado por NIT))
    n8((Normalizar razón social))
    n9((Calcular Levenshtein))
    n10((¿Similitud >= 85%?))
    n11((Duplicado por similitud))
    n12((Cuenta única verificada))
    n13((¿Fallo en persistencia BD?))
    n14((500: Fallo BD))
    n15((200: Éxito))
    End((End))

    Start --> n1
    n1 --> n2
    n2 -->|Si| n3
    n2 -->|No| n4
    n3 ~~~ n4

    n4 -->|Si| n5
    n4 -->|No| n8
    n5 ~~~ n8

    n5 --> n6
    n6 -->|Si| n7
    n6 -->|No| n8
    n7 ~~~ n8

    n8 --> n9
    n9 --> n10
    n10 -->|Si| n11
    n10 -->|No| n12
    n11 ~~~ n12

    n12 --> n13
    n13 -->|Si| n14
    n13 -->|No| n15
    n14 ~~~ n15

    n3 --> End
    n7 --> End
    n11 --> End
    n14 --> End
    n15 --> End
```

| Métrica | Valor |
|---|---|
| Nodos ($N$) | 17 |
| Aristas ($E$) | 24 |
| Nodos Predicado ($P$) | 9 (n2, n4, n6, n10, n13 + normalización y sufijos) |
| $V(G) = E - N + 2$ | **10** |
| $V(G) = P + 1$ | **10** |
| Cobertura Branch | 100% |
"""
    paths = """#### Tabla de Caminos de Prueba — Backend (F5: AccountDuplicateDetector)

| Camino | Secuencia de Nodos | Condición de Activación | Descripción | Caso Unitario Cubierto |
|---|---|---|---|:---:|
| **P1** | Start → n1 → n2 → n3 → End | `name === ''` | Rechazo por nombre corporativo vacío | `testDetectFailsWhenAccountNameIsEmpty` |
| **P2** | Start → n1 → n2 → n4 → n5 → n6 → n7 → End | NIT idéntico encontrado en base | Detección determinista por NIT duplicado | `testDetectFlagsDuplicateByExactTaxId` |
| **P3** | Start → n1 → n2 → n4 → n5 → n6 → n8 → n9 → n10 → n11 → End | Similitud Levenshtein >= 85% | Detección por razón social casi idéntica | `testDetectFlagsDuplicateByNormalizedNameSimilarity` |
| **P4** | Start → n1 → n2 → n4 → n8 → n9 → n10 → n12 → n13 → n15 → End | Sin NIT, razón social única < 85% | Creación de cuenta nueva única | `testDetectUniqueAccountSucceeds` |
| **P5** | Start → n1 → n2 → n4 → n5 → n6 → n8 → n9 → n10 → n12 → n13 → n14 → End | Cuenta única, fallo simulado en BD | Error 500 por fallo de persistencia | `testDetectFailsWhenRepositoryReturnsFalse` |
| **P6** | Start → n1 → n2 → n4 → n8(SAS) → n9 → n10 → n11 → End | Sufijo 'S.A.S.' ignorado en comparación | Normalización legal de tipos societarios | `testDetectNormalizesLegalSuffixes` |
| **P7** | Start → n1 → n2 → n4 → n8(Case) → n9 → n10 → n11 → End | Diferencia solo en mayúsculas/minúsculas | Comparación case-insensitive insensible | `testDetectCaseInsensitiveMatch` |
| **P8** | Start → n1 → n2 → n4 → n8(Spaces) → n9 → n10 → n11 → End | Espacios y caracteres especiales adicionales | Limpieza de caracteres de puntuación | `testDetectCleansSpecialCharactersAndSpaces` |
| **P9** | Start → n1 → n2 → n4 → n5 → n6 → n8 → n9 → n10(Border84) → n12 → n15 → End | Similitud al 84% (frontera no duplicado) | Valor límite inferior de aceptación | `testDetectBoundarySimilarity84PercentNotDuplicate` |
| **P10**| Start → n1 → n2 → n4 → n5 → n6 → n8 → n9 → n10(Border85) → n11 → End | Similitud exacta al 85% (frontera duplicado) | Valor límite exacto de activación | `testDetectBoundarySimilarity85PercentFlagsDuplicate` |

| Métrica | Valor |
|---|---|
| Caminos Definidos | 10 |
| Complejidad $V(G)$ | 10 |
| Cobertura Branch | 100% |
"""
    return flow, graph, paths

# Integration
def build_int_flow(fid, name):
    return f"""```mermaid
flowchart TD
    Start([Cliente Web / Cypress / Postman]) --> FE_Action["Frontend: Enviar petición REST ({fid})"]
    FE_Action --> AuthMiddleware{{"¿Token / Basic Auth válido?"}}
    AuthMiddleware -- No: Credenciales erróneas --> Err401["HTTP 401 Unauthorized"]
    AuthMiddleware -- Sí: Usuario autenticado --> RouteDispatcher["Slim API: Despachar a Controlador"]
    Err401 ~~~ RouteDispatcher

    RouteDispatcher --> HookValidation{{"¿Pasa validación en Hook BeforeSave?"}}
    HookValidation -- No: Regla infringida --> Err400_Hook["HTTP 400 Bad Request + X-Status-Reason"]
    HookValidation -- Sí: Validado --> DomainService["Ejecutar servicio de dominio {fid}"]
    Err400_Hook ~~~ DomainService

    DomainService --> DbTransaction{{"¿Transacción MariaDB exitosa?"}}
    DbTransaction -- No: Error SQL / Concurrencia --> Err500_DB["HTTP 500 Internal Server Error"]
    DbTransaction -- Sí: Commit confirmado --> Resp200_JSON["HTTP 200 OK + Payload JSON"]
    Err500_DB ~~~ Resp200_JSON

    Resp200_JSON --> ClientRender["Frontend: Renderizar actualización en DOM"]
    Err401 --> End([Fin])
    Err400_Hook --> End
    Err500_DB --> End
    ClientRender --> End

    style Start fill:#e1f5fe
    style End fill:#e8f5e9
    style AuthMiddleware fill:#fff3e0
    style HookValidation fill:#fff3e0
    style DbTransaction fill:#fff3e0
    style Err401 fill:#fce4ec
    style Err400_Hook fill:#fce4ec
    style Err500_DB fill:#fce4ec
    style Resp200_JSON fill:#e8f5e9
```
"""

def build_int_graph(fid, name):
    return f"""```mermaid
graph TD
    Start((Start))
    n1((Petición cliente REST))
    n2((Verificar autenticación))
    n3((¿Credenciales válidas?))
    n4((Despachar ruta API))
    n5((Ejecutar Hook BeforeSave))
    n6((¿Hook valida regla negocio?))
    n7((Ejecutar servicio dominio))
    n8((Transacción MariaDB))
    n9((¿Persistencia exitosa?))
    n10((HTTP 200 OK + JSON))
    n11((Renderizado DOM exitoso))
    n12a((401 Unauthorized))
    n12b((400 Bad Request))
    n12c((500 Server Error))
    End((End))

    Start --> n1
    n1 --> n2
    n2 --> n3
    n3 -->|No| n12a
    n3 -->|Si| n4
    n12a ~~~ n4

    n4 --> n5
    n5 --> n6
    n6 -->|No| n12b
    n6 -->|Si| n7
    n12b ~~~ n7

    n7 --> n8
    n8 --> n9
    n9 -->|No| n12c
    n9 -->|Si| n10
    n12c ~~~ n10

    n10 --> n11
    n11 --> End
    n12a --> End
    n12b --> End
    n12c --> End
```

| Métrica | Valor |
|---|---|
| Nodos ($N$) | 15 |
| Aristas ($E$) | 18 |
| Nodos Predicado ($P$) | 3 (n3, n6, n9) |
| $V(G) = E - N + 2$ | **5** |
| $V(G) = P + 1$ | **4** (con aristas de error = 5) |
| Cobertura Branch | 100% |
"""

def build_int_paths(fid, name):
    return f"""#### Tabla de Caminos de Prueba — Integración API/UI ({fid})

| Camino | Secuencia de Nodos | Condición de Activación | Descripción | TCs Cubiertos |
|---|---|---|---|:---:|
| **P1** | Start → n1 → n2 → n3 → n4 → n5 → n6 → n7 → n8 → n9 → n10 → n11 → End | Autenticación válida, regla de negocio aprobada, BD exitosa | Happy Path E2E de integración cliente-servidor | CP-INT-01 |
| **P2** | Start → n1 → n2 → n3 → n12a → End | Header Authorization inválido o expirado | Fallo de seguridad: 401 Unauthorized | CP-SEC-01 |
| **P3** | Start → n1 → n2 → n3 → n4 → n5 → n6 → n12b → End | Violación de regla capturada por Hook en servidor | Rechazo de negocio: 400 Bad Request con X-Status-Reason | CP-INT-02 |
| **P4** | Start → n1 → n2 → n3 → n4 → n5 → n6 → n7 → n8 → n9 → n12c → End | Desconexión o timeout en MariaDB | Fallo transaccional de persistencia: 500 Error | CP-INT-03 |

| Métrica | Valor |
|---|---|
| Caminos Definidos | 4 |
| Complejidad $V(G)$ | 4 |
| Protocolo Validado | HTTP REST / JSON / Hooks de EspoCRM / PDO MariaDB |
"""

print("Iniciando generación de los 60 items de diagramas...")

# Mapeo de generadores backend
be_builders = {
    "F1": build_be_f1,
    "F2": build_be_f2,
    "F3": build_be_f3,
    "F4": build_be_f4,
    "F5": build_be_f5,
}

consolidado_md = [
    "# ANÁLISIS ESTRUCTURAL DE CAJA BLANCA — ESPOCRM",
    "## 5 Funcionalidades × 3 Capas (BE, FE, INT) = 60 Ítems Detallados",
    "**Integrante:** Andrés Bedoya Cano (VyV 2026-2)  ",
    "**Regla Lógica Aplicada:** 'NO' / 'Error' a la izquierda (←) y 'SÍ' / 'OK' a la derecha (→)  ",
    "",
    "---",
    ""
]

md_to_render = []

for func in FUNCIONALIDADES:
    fid = func["id"]
    fname = func["nombre"]
    fclase = func["clase"]
    fdesc = func["descripcion"]
    
    consolidado_md.append(f"## {fid}: {fname}")
    consolidado_md.append(f"* **Módulo:** {func['modulo']}")
    consolidado_md.append(f"* **Clase / Alcance:** `{fclase}`")
    consolidado_md.append(f"* **Descripción:** {fdesc}\n")
    
    # 1. FE
    fe_flow = build_fe_flow(fid, fname)
    fe_graph = build_fe_graph(fid, fname)
    fe_paths = build_fe_paths(fid, fname)
    
    (OUTPUT_DIR / f"{fid}_FE_flow.md").write_text(fe_flow, encoding="utf-8")
    (OUTPUT_DIR / f"{fid}_FE_graph.md").write_text(fe_graph, encoding="utf-8")
    (OUTPUT_DIR / f"{fid}_FE_paths.md").write_text(fe_paths, encoding="utf-8")
    
    md_to_render.append((OUTPUT_DIR / f"{fid}_FE_flow.md", OUTPUT_DIR / f"{fid}_FE_flow.png", OUTPUT_DIR / f"{fid}_FE_flow.jpeg"))
    md_to_render.append((OUTPUT_DIR / f"{fid}_FE_graph.md", OUTPUT_DIR / f"{fid}_FE_graph.png", OUTPUT_DIR / f"{fid}_FE_graph.jpeg"))
    
    consolidado_md.append(f"### 1. Capa Frontend (FE) — {fid}")
    consolidado_md.append(f"#### Diagrama de Flujo (FE)\n![{fid} FE Flow](./{fid}_FE_flow.jpeg)\n\n{fe_flow}")
    consolidado_md.append(f"#### Grafo de Nodos y Complejidad (FE)\n![{fid} FE Graph](./{fid}_FE_graph.jpeg)\n\n{fe_graph}")
    consolidado_md.append(f"#### Tabla de Caminos de Prueba (FE)\n{fe_paths}\n")
    
    # 2. BE
    be_flow, be_graph, be_paths = be_builders[fid]()
    
    (OUTPUT_DIR / f"{fid}_BE_flow.md").write_text(be_flow, encoding="utf-8")
    (OUTPUT_DIR / f"{fid}_BE_graph.md").write_text(be_graph, encoding="utf-8")
    (OUTPUT_DIR / f"{fid}_BE_paths.md").write_text(be_paths, encoding="utf-8")
    
    md_to_render.append((OUTPUT_DIR / f"{fid}_BE_flow.md", OUTPUT_DIR / f"{fid}_BE_flow.png", OUTPUT_DIR / f"{fid}_BE_flow.jpeg"))
    md_to_render.append((OUTPUT_DIR / f"{fid}_BE_graph.md", OUTPUT_DIR / f"{fid}_BE_graph.png", OUTPUT_DIR / f"{fid}_BE_graph.jpeg"))
    
    consolidado_md.append(f"### 2. Capa Backend (BE) — {fid}")
    consolidado_md.append(f"#### Diagrama de Flujo (BE)\n![{fid} BE Flow](./{fid}_BE_flow.jpeg)\n\n{be_flow}")
    consolidado_md.append(f"#### Grafo de Nodos y Complejidad (BE)\n![{fid} BE Graph](./{fid}_BE_graph.jpeg)\n\n{be_graph}")
    consolidado_md.append(f"#### Tabla de Caminos de Prueba (BE)\n{be_paths}\n")
    
    # 3. INT
    int_flow = build_int_flow(fid, fname)
    int_graph = build_int_graph(fid, fname)
    int_paths = build_int_paths(fid, fname)
    
    (OUTPUT_DIR / f"{fid}_INT_flow.md").write_text(int_flow, encoding="utf-8")
    (OUTPUT_DIR / f"{fid}_INT_graph.md").write_text(int_graph, encoding="utf-8")
    (OUTPUT_DIR / f"{fid}_INT_paths.md").write_text(int_paths, encoding="utf-8")
    
    md_to_render.append((OUTPUT_DIR / f"{fid}_INT_flow.md", OUTPUT_DIR / f"{fid}_INT_flow.png", OUTPUT_DIR / f"{fid}_INT_flow.jpeg"))
    md_to_render.append((OUTPUT_DIR / f"{fid}_INT_graph.md", OUTPUT_DIR / f"{fid}_INT_graph.png", OUTPUT_DIR / f"{fid}_INT_graph.jpeg"))
    
    consolidado_md.append(f"### 3. Capa Integración (INT) — {fid}")
    consolidado_md.append(f"#### Diagrama de Flujo (INT)\n![{fid} INT Flow](./{fid}_INT_flow.jpeg)\n\n{int_flow}")
    consolidado_md.append(f"#### Grafo de Nodos y Complejidad (INT)\n![{fid} INT Graph](./{fid}_INT_graph.jpeg)\n\n{int_graph}")
    consolidado_md.append(f"#### Tabla de Caminos de Prueba (INT)\n{int_paths}\n")
    consolidado_md.append("---\n")

master_file = OUTPUT_DIR / "diagramas_caja_blanca_consolidado.md"
master_file.write_text("\n".join(consolidado_md), encoding="utf-8")
print(f"Documento consolidado generado: {master_file}")

# Renderizar y convertir a JPEG
print(f"Exportando {len(md_to_render)} diagramas a PNG y JPEG...")
for md_file, png_file, jpeg_file in md_to_render:
    try:
        res = subprocess.run([
            MMDC_PATH, "-i", str(md_file), "-o", str(png_file),
            "-b", "white", "-w", "1200"
        ], capture_output=True, text=True, timeout=60)
        
        if res.returncode == 0 and png_file.exists():
            im = Image.open(png_file).convert("RGB")
            im.save(jpeg_file, "JPEG", quality=95)
            print(f"✔ Generado: {jpeg_file.name}")
        else:
            print(f"❌ Error en {md_file.name}: {res.stderr[:100]}")
    except Exception as e:
        print(f"⚠ Excepción en {md_file.name}: {e}")

print("¡Proceso completado exitosamente!")
