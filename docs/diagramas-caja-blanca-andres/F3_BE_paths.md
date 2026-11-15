#### Tabla de Caminos de Prueba — Backend (F3: QuoteDiscountCalculator)

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
