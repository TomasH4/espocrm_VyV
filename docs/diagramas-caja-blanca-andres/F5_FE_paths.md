#### Tabla de Caminos de Prueba — Frontend (F5)

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
