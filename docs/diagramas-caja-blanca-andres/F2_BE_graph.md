```mermaid
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
