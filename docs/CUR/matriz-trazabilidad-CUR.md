# Matriz de trazabilidad — módulo CUR (Moneda y tasas de cambio)

**Criterio de la rúbrica:** 3. **Integrante:** Alejandro Bustamante. **Fecha:** 16 de noviembre de 2026.
La matriz vincula cada requisito (funcionalidad) con sus casos de prueba, el tipo y la técnica, el archivo del repositorio, el resultado, los defectos y la evidencia. Todas las rutas son relativas a la raíz del repositorio.

## 1. Requisitos

| ID | Requisito | Código | Interfaz |
| :--- | :--- | :--- | :--- |
| **REQ-CUR-F1** | Convertir montos entre las monedas configuradas e informar con claridad los datos inválidos | `Core/Formula/Functions/ExtGroup/CurrencyGroup/ConvertType.php`, `Core/Currency/Converter.php` | Formula Sandbox, `POST /api/v1/Formula/action/run` |
| **REQ-CUR-F2** | Calcular con aritmética decimal exacta (escala de 14 decimales) | `Core/Currency/CalculatorUtil.php` | Indirecta (conversión) |
| **REQ-CUR-F3** | Aceptar solo montos válidos en monedas configuradas | `Classes/FieldValidators/CurrencyType.php`, `client/src/views/fields/currency.ts` | Formulario Campaign, `POST /api/v1/Campaign` |
| **REQ-CUR-F4** | Consultar y actualizar tasas con control de permisos y validación | `Tools/Currency/RateService.php`, `Api/Get.php`, `Api/PutUpdate.php` | `GET` y `PUT /api/v1/CurrencyRate` |
| **REQ-CUR-F5** | Mantener en la configuración la tasa vigente (la más reciente que no esté en el futuro) | `Tools/Currency/SyncManager.php`, `RateEntryProvider.php`, `RecordHooks/CurrencyRecordRate/*` | Currencies › COP › Rates |

## 2. Matriz requisito → pruebas

Leyenda de resultados: ✔ todos pasan · ◐ pasan con observación · ✘ fallo documentado. Los resultados son los de las ejecuciones del 15 y 16 de noviembre de 2026; las automatizadas, después del despliegue final.

### REQ-CUR-F1 — Conversión

| Tipo | Casos | Técnica | Archivo | Resultado | Defecto / hallazgo |
| :--- | :--- | :--- | :--- | :---: | :--- |
| Caja negra | CN-CUR-F1-01 a 17 (5 escenarios) | Particiones y valores límite | `docs/CUR/Casos y Escenarios EspoCRM.xlsx` | 13 ✔ · 4 ✘ | DEF-CUR-01 (F1-11, 12, 13), DEF-CUR-02 (F1-17) |
| Caja blanca | 4 grafos: Sandbox `run()` V(G)=8, `ConvertType` 7, `Converter::convert` 2, `getCurrencyRate` 3; CB-CUR-F1-FE-01/02, BE-01/02 | Caminos independientes | `docs/CUR/CUR-F1/caja-blanca.md` | ✔ | — |
| Unitarias / TDD | 11 (ciclos TDD 3 y 4) | AAA, mocks | `tests/unit/Espo/VyV/Currency/ConvertTypeTest.php` | ✔ 11 | DEF-CUR-01 y 02 corregidos |
| Cypress | 9 (2 de interfaz, 7 de API) | E2E y API | `cypress/e2e/cur/CUR-F1_conversion.cy.js` | ✔ 9 | — |
| BDD | 7 escenarios | Gherkin y Screenplay | `tests_bdd_screenplay/features/alejandro/CUR-F1_conversion.feature` | ✔ 7 | — |
| Regresión | R-CUR.B1, D1 a D4 | Selección por riesgo | `cypress/e2e/cur/regression/R-CUR_monedas_tasas.regression.cy.js` | ✔ 5 | — |
| Accesibilidad | CP-A11Y-CUR-01 (Sandbox), 03 | axe-core y teclado | `cypress/e2e/cur/a11y/CUR_accesibilidad.cy.js` | ✔ | A11Y-CUR-01, 02 |
| Seguridad | SEC-CUR-03 (×2), SEC-CUR-14 | DAST OWASP A01, A05 | `cypress/e2e/cur/security/CUR_seguridad.cy.js` | ✔ | SEC-H-03 corregido |
| IA | ST-CUR-01, MCP-CUR-03, DE-CUR-01 a 04, 06, 07 | Stagehand, MCP, DeepEval | `tests_stagehand/alejandro/`, `tests_playwright_mcp_alejandro/`, `tests_deepeval_alejandro/` | ✔ ST/MCP · ◐ DE 06, 07 | Límites de las métricas de DeepEval |

### REQ-CUR-F2 — Aritmética decimal

| Tipo | Casos | Técnica | Archivo | Resultado | Defecto / hallazgo |
| :--- | :--- | :--- | :--- | :---: | :--- |
| Caja negra | CN-CUR-F2-01 a 08 (3 escenarios) | Particiones y valores límite | Excel | 5 ✔ · 3 ◐ | OBS-CUR-02, OBS-CUR-03 |
| Caja blanca | `multiply` V(G)=2, `divide` 3 (rama null inalcanzable), `round` 3; CB-CUR-F2-01 a 04 | Caminos independientes | `docs/CUR/CUR-F2/caja-blanca.md` | ✔ | Código muerto en `divide` |
| Unitarias | 10 con bcmath y 7 sin bcmath | AAA, valores límite | `tests/unit/Espo/VyV/Currency/CalculatorUtilTest.php`, `CalculatorUtilSinBcmathTest.php` | ✔ 17 | — |
| Cypress | 4 | API (fórmula) | `cypress/e2e/cur/CUR-F2_aritmetica.cy.js` | ✔ 4 | OBS-CUR-03 verificada |
| BDD | 4 escenarios | Gherkin | `tests_bdd_screenplay/features/alejandro/CUR-F2_aritmetica.feature` | ✔ 4 | — |
| Regresión | R-CUR.B2 | Integración | Suite de regresión | ✔ | — |

### REQ-CUR-F3 — Validación de campos de moneda

| Tipo | Casos | Técnica | Archivo | Resultado | Defecto / hallazgo |
| :--- | :--- | :--- | :--- | :---: | :--- |
| Caja negra | CN-CUR-F3-01 a 19 (4 escenarios) | Particiones y valores límite | Excel | 15 ✔ · 4 ◐ | OBS-CUR-01, 04, 05 |
| Caja blanca | `fetch()` V(G)=5, `checkValid` 4, `checkInPermittedRange` 7, `checkValidCurrency` 5; CB-CUR-F3-01 a 10 | Caminos independientes | `docs/CUR/CUR-F3/caja-blanca.md` | ✔ (CB-01/02 de frontend no ejecutados por decisión) | — |
| Unitarias | 17 | Mocks de Entity y Config | `tests/unit/Espo/VyV/Currency/CurrencyTypeTest.php` | ✔ 17 | — |
| Cypress | 10 (3 de interfaz, 7 de API) | E2E y API | `cypress/e2e/cur/CUR-F3_validacion_moneda.cy.js` | ✔ 10 | — |
| BDD | 7 escenarios | Gherkin y Screenplay | `.../features/alejandro/CUR-F3_validacion_moneda.feature` | ✔ 7 | — |
| Accesibilidad | CP-A11Y-CUR-01 (Campaign), 02, 05, 08, 09, 10, 13, 14 | axe-core y comprobaciones manuales | Suite de accesibilidad | ✔ | A11Y-CUR-01, 03, 05, 06 |
| Seguridad | SEC-CUR-10 | DAST A03 | Suite de seguridad | ✔ | — |
| IA | ST-CUR-02, MCP-CUR-04 | Stagehand, MCP | Carpetas de IA | ✔ | Campos sin nombre accesible (8 de 12) |
| Usabilidad | Principios 4, 7, 8, 9 | Heurística Granollers | `docs/CUR/usabilidad/Evaluacion-Heuristica-CUR.xlsx` | 56,8 % global | UX-CUR-04, 05 |

### REQ-CUR-F4 — Consulta y actualización de tasas

| Tipo | Casos | Técnica | Archivo | Resultado | Defecto / hallazgo |
| :--- | :--- | :--- | :--- | :---: | :--- |
| Caja negra | CN-CUR-F4-01 a 13 (5 escenarios) | Tablas de decisión (perfil × acción), valores límite | Excel | 10 ✔ · 2 ✘ · 1 ◐ | DEF-CUR-03 (F4-08), DEF-CUR-04 (F4-07), OBS-CUR-06 (F4-11) |
| Caja blanca | Entrada V(G)=3, permisos 3, `get` 2, `set` 4, `writeOne` 3; CB-CUR-F4-01 a 03 | Caminos independientes | `docs/CUR/CUR-F4/caja-blanca.md` | ✔ | — |
| Unitarias / TDD | 22 (ciclos TDD 1 y 2) | AAA, mocks de 8 dependencias | `tests/unit/Espo/VyV/Currency/RateServiceTest.php` | ✔ 22 | DEF-CUR-03 y 04 corregidos |
| Cypress (API) | 15 | API REST | `cypress/e2e/cur/CUR-F4_api_tasas.cy.js` | ✔ 15 | — |
| BDD | 13 escenarios | Gherkin y Screenplay | `.../features/alejandro/CUR-F4_api_tasas.feature` | ✔ 13 | — |
| Regresión | R-CUR.A1 a A10, B3, C1, C2 | Selección por riesgo | Suite de regresión | ✔ 13 | — |
| Seguridad | SEC-CUR-01, 02, 06 a 09, 12, 15, 17 | DAST A01, A02, A03, A04, A05, A07 | Suite de seguridad | ✔ | SEC-H-01 (corregido), 05, 06 |
| IA | ST-CUR-04, DE-CUR-05 | Stagehand, DeepEval | Carpetas de IA | ✔ | — |

### REQ-CUR-F5 — Sincronización de la tasa vigente

| Tipo | Casos | Técnica | Archivo | Resultado | Defecto / hallazgo |
| :--- | :--- | :--- | :--- | :---: | :--- |
| Caja negra | CN-CUR-F5-01 a 12 (6 escenarios) | Transición de estados, valores límite | Excel | 11 ✔ · 1 ✘ | DEF-CUR-05 (F5-07) |
| Caja blanca | `validateRange` V(G)=8, hook 2, `updateCode` 2, `syncCode` 2; CB-CUR-F5-01 a 03 | Caminos independientes | `docs/CUR/CUR-F5/caja-blanca.md` | ✔ (CB-02 de frontend no ejecutado por decisión) | — |
| Unitarias / TDD | 11 (ciclo TDD 5) | Mocks de ORM, ConfigWriter y EventDispatcher | `tests/unit/Espo/VyV/Currency/RateSyncTest.php` | ✔ 11 | DEF-CUR-05 corregido |
| Cypress | 8 (3 de interfaz, 5 de API) | E2E y API | `cypress/e2e/cur/CUR-F5_sincronizacion.cy.js` | ✔ 8 | — |
| BDD | 6 escenarios | Gherkin y Screenplay | `.../features/alejandro/CUR-F5_sincronizacion.feature` | ✔ 6 | — |
| Regresión | R-CUR.C3 | Integración | Suite de regresión | ✔ | — |
| Accesibilidad | CP-A11Y-CUR-01 (Currencies, COP, modal), 04, 06, 07, 11, 12 | axe-core y teclado | Suite de accesibilidad | ✔ | A11Y-CUR-04, 07 |
| Seguridad | SEC-CUR-04 (×2), 05, 11 | DAST A01, A03 | Suite de seguridad | ✔ | — |
| IA | ST-CUR-03, MCP-CUR-05 | Stagehand, MCP | Carpetas de IA | ✔ | `fill` no sirve con AutoNumeric |

## 3. Defectos: origen, corrección y verificación

| Defecto | Requisito | Detectado por | Corrección | Verificado por | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| DEF-CUR-01 Moneda no configurada → 500 | F1 | CN-CUR-F1-11, 12, 13 | TDD ciclo 3 — `ConvertType::checkCurrency()` | `ConvertTypeTest`, R-CUR.D1/D2, Cypress F1, BDD F1, SEC-CUR-14 | **Cerrado** |
| DEF-CUR-02 Monto no numérico → `AssertionError` 500 | F1 | CN-CUR-F1-17 | TDD ciclo 4 — `ConvertType::checkAmount()` | `ConvertTypeTest`, R-CUR.D3, Cypress F1, BDD F1 | **Cerrado** |
| DEF-CUR-03 Tasa no numérica → 500 (y `true` guardado como 1) | F4 | CN-CUR-F4-08; TDD ciclo 2 | TDD ciclo 2 — `RateService::validateRate()` | `RateServiceTest`, R-CUR.A2/A3, Cypress F4, SEC-CUR-07 a 09 | **Cerrado** |
| DEF-CUR-04 Tasa 0 o menor que 0.0001 aceptada | F4 | CN-CUR-F4-07 | TDD ciclo 1 — mínimo leído de la definición del campo | `RateServiceTest`, R-CUR.A1/A4/B3, Cypress F4, SEC-CUR-12 | **Cerrado** |
| DEF-CUR-05 Sin tasa vigente la configuración pasa a 1 | F5 | CN-CUR-F5-07 | TDD ciclo 5 — `SyncManager::updateCode()` conserva la última tasa | `RateSyncTest` | **Cerrado** (verificado por unitarias; no se repite E2E porque obliga a borrar la tasa vigente) |
| OBS-CUR-06 Cuerpo `[1,2]` aceptado | F4 | CN-CUR-F4-11 | Efecto de `validateRate()` | Cypress F4, R-CUR.A5 | **Cerrado** |
| OBS-CUR-01 COP mostrado con «$» | F3 | CN-CUR-F3-02 | — (núcleo de EspoCRM) | Heurística UX-CUR-04 | Abierto (recomendación) |
| OBS-CUR-02 / 03 Truncamiento en el decimal 14 | F2 | CN-CUR-F2-04, 06, 08 | — (diseño de `CalculatorUtil`) | `CalculatorUtilTest`, Cypress F2 | Abierto (documentado) |
| OBS-CUR-04 Pantalla 13 dígitos, API 14 | F3 | CN-CUR-F3-07, 08 | — | `CurrencyTypeTest`, Cypress F3 | Abierto (recomendación) |
| OBS-CUR-05 Letras en el monto se borran sin aviso | F3 | CN-CUR-F3-09 | — | Cypress F3, UX-CUR-05 | Abierto (recomendación) |

## 4. Resumen cuantitativo

| Tipo de prueba | F1 | F2 | F3 | F4 | F5 | Total | Pasan |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Caja negra (manual) | 17 | 8 | 19 | 13 | 12 | **69** | 54 ✔ · 8 ◐ · 7 ✘ (antes de las correcciones) |
| Unitarias (PHPUnit) | 11 | 17 | 17 | 22 | 11 | **78** | 78 |
| Cypress (interfaz y API) | 9 | 4 | 10 | 15 | 8 | **46** | 46 |
| BDD (Gherkin y Screenplay) | 7 | 4 | 7 | 13 | 6 | **37** | 37 |
| Regresión | 5 | 1 | — | 13 | 1 | **20** | 20 (10 en la versión anterior) |
| Accesibilidad | — | — | — | — | — | **19** (pantallas de F1, F3 y F5) | 19 |
| Seguridad (DAST) | — | — | — | — | — | **20** (F1, F3, F4 y F5) | 20 |
| IA (Stagehand, MCP, DeepEval) | — | — | — | — | — | **16** | 14 |
| **Total automatizado** | | | | | | **236** | **234** |

Los 7 ✘ de caja negra corresponden a los 5 defectos: todos se corrigieron, y la verificación posterior está en las suites automatizadas. Los 2 casos de IA que no pasan son DE-CUR-06 y 07, por límites de las métricas de DeepEval; el componente responde correctamente (Exactitud 1.00).
