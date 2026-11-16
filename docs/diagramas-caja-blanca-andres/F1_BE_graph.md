```mermaid
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
| $V(G) = 	ext{Regiones } R$ | **9 cerradas + 1 infinita = 10** |
