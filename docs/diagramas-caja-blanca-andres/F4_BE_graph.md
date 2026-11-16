```mermaid
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
