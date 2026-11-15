#### Tabla de Caminos de Prueba — Integración API/UI (F2)

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
