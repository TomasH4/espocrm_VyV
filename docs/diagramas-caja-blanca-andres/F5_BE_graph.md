```mermaid
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
