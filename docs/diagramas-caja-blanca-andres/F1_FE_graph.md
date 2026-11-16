```mermaid
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
