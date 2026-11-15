```mermaid
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
