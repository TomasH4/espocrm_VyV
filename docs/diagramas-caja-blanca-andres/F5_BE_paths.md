#### Tabla de Caminos de Prueba — Backend (F5: AccountDuplicateDetector)

| Camino | Secuencia de Nodos | Condición de Activación | Descripción | Caso Unitario Cubierto |
|---|---|---|---|:---:|
| **P1** | Start → n1 → n2 → n3 → End | `name === ''` | Rechazo por nombre corporativo vacío | `testDetectFailsWhenAccountNameIsEmpty` |
| **P2** | Start → n1 → n2 → n4 → n5 → n6 → n7 → End | NIT idéntico encontrado en base | Detección determinista por NIT duplicado | `testDetectFlagsDuplicateByExactTaxId` |
| **P3** | Start → n1 → n2 → n4 → n5 → n6 → n8 → n9 → n10 → n11 → End | Similitud Levenshtein >= 85% | Detección por razón social casi idéntica | `testDetectFlagsDuplicateByNormalizedNameSimilarity` |
| **P4** | Start → n1 → n2 → n4 → n8 → n9 → n10 → n12 → n13 → n15 → End | Sin NIT, razón social única < 85% | Creación de cuenta nueva única | `testDetectUniqueAccountSucceeds` |
| **P5** | Start → n1 → n2 → n4 → n5 → n6 → n8 → n9 → n10 → n12 → n13 → n14 → End | Cuenta única, fallo simulado en BD | Error 500 por fallo de persistencia | `testDetectFailsWhenRepositoryReturnsFalse` |
| **P6** | Start → n1 → n2 → n4 → n8(SAS) → n9 → n10 → n11 → End | Sufijo 'S.A.S.' ignorado en comparación | Normalización legal de tipos societarios | `testDetectNormalizesLegalSuffixes` |
| **P7** | Start → n1 → n2 → n4 → n8(Case) → n9 → n10 → n11 → End | Diferencia solo en mayúsculas/minúsculas | Comparación case-insensitive insensible | `testDetectCaseInsensitiveMatch` |
| **P8** | Start → n1 → n2 → n4 → n8(Spaces) → n9 → n10 → n11 → End | Espacios y caracteres especiales adicionales | Limpieza de caracteres de puntuación | `testDetectCleansSpecialCharactersAndSpaces` |
| **P9** | Start → n1 → n2 → n4 → n5 → n6 → n8 → n9 → n10(Border84) → n12 → n15 → End | Similitud al 84% (frontera no duplicado) | Valor límite inferior de aceptación | `testDetectBoundarySimilarity84PercentNotDuplicate` |
| **P10**| Start → n1 → n2 → n4 → n5 → n6 → n8 → n9 → n10(Border85) → n11 → End | Similitud exacta al 85% (frontera duplicado) | Valor límite exacto de activación | `testDetectBoundarySimilarity85PercentFlagsDuplicate` |

| Métrica | Valor |
|---|---|
| Caminos Definidos | 10 |
| Complejidad $V(G)$ | 10 |
| Cobertura Branch | 100% |
