```mermaid
graph TD
    Start((Start))
    n1((Captura parámetros cotización))
    n2((¿quoteId vacío?))
    n3((400: quoteId obligatorio))
    n4((¿monto <= 0?))
    n5((400: Monto inválido))
    n6((¿monto > 20000? Tier 4))
    n7((¿monto >= 10000? Tier 3))
    n8((¿monto >= 3000? Tier 2))
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
