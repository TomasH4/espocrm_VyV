# CUR — Refactorización y despliegue final

**Criterio de la rúbrica:** 15 (Refactorización y despliegue final). **Fecha:** 16 de noviembre de 2026.
**Alcance:** los cambios derivados de las pruebas del módulo Moneda y tasas de cambio (CUR), la comparación entre la versión anterior (EspoCRM 10.1.1 sin cambios) y la versión final, y el último despliegue con las pruebas posteriores.

## 1. Cambios derivados de las pruebas

| Defecto u observación | Origen (prueba que lo encontró) | Archivo | Cambio | Ciclo |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-CUR-04** Tasa menor que 0.0001 aceptada por la API | CN-CUR-F4-07 (caja negra) | `Tools/Currency/RateService.php` | `validateRate()`: mínimo leído de la definición del campo Rate | TDD 1 ([docs/CUR/tdd](../tdd/README.md)) |
| **DEF-CUR-03** Tasa no numérica → 500; `true` guardado como 1 | CN-CUR-F4-08, TDD ciclo 2 | `Tools/Currency/RateService.php` | `validateRate()`: el valor debe ser numérico → 400 | TDD 2 |
| **OBS-CUR-06** Cuerpo `[1,2]` aceptado | Cypress CN-CUR-F4-11 | (efecto de `validateRate()`) | Ahora → 400 | — |
| **DEF-CUR-01** Moneda no configurada (EUR, XYZ, `usd`) → 500 | CN-CUR-F1-11/12/13 | `Core/Formula/Functions/ExtGroup/CurrencyGroup/ConvertType.php` | `checkCurrency()`: error de fórmula «Currency 'EUR' is not configured.» | **TDD 3** |
| **DEF-CUR-02** Monto no numérico → `AssertionError` 500 | CN-CUR-F1-17 | `ConvertType.php` | `checkAmount()` reemplaza el `assert()`: «The amount 'abc' is not a number.» | **TDD 4** |
| **DEF-CUR-05** Sin tasa vigente la configuración pasa a 1 | CN-CUR-F5-07 | `Tools/Currency/SyncManager.php` | Conserva la última tasa conocida; 1.0 solo si la moneda nunca tuvo tasa | **TDD 5** |

**Frontend:** no hubo cambios en el cliente. Las validaciones del formulario (mínimo de la tasa, máscara del monto) ya existían y funcionan; los defectos estaban en el backend. Al cambiar el backend, la pantalla del Formula Sandbox muestra ahora el motivo en el campo *Error Message* en lugar de «Internal server error – Check logs» (verificado por Cypress CN-CUR-F1-13 en la interfaz).

### Ciclos TDD 3 a 5 (esta refactorización)

| Ciclo | Rojo | Verde | Evidencia |
| :--- | :--- | :--- | :--- |
| 3–4 `ConvertType` | 8 pruebas, **4 fallan**: las 3 monedas no configuradas y `'abc'` (este último con `AssertionError`) | 8 / 8 | [`ciclo3-4-rojo.txt`](salidas/ciclo3-4-rojo.txt), [`ciclo3-4-verde.txt`](salidas/ciclo3-4-verde.txt), [`ciclo3-4-verde.diff`](salidas/ciclo3-4-verde.diff) |
| 5 `SyncManager` | 11 pruebas, **1 falla**: sin tasa vigente se escribía 1.0 | 11 / 11 | [`ciclo5-rojo.txt`](salidas/ciclo5-rojo.txt), [`ciclo5-verde.txt`](salidas/ciclo5-verde.txt), [`ciclo5-verde.diff`](salidas/ciclo5-verde.diff) |
| Refactor | `ConvertType::process()` se lee como el flujo de negocio; las validaciones pasan a `checkAmount()` y `checkCurrency()`. Se agregan pruebas de las ramas de tipo (CN-CUR-F1-15/16) | 78 pruebas del módulo | [`refactor-final.diff`](salidas/refactor-final.diff), [`refactor-cobertura.txt`](salidas/refactor-cobertura.txt) |

```php
// ConvertType::process() — versión final
$this->checkAmount($amount);
$this->checkCurrency($fromCode);
$this->checkCurrency($toCode);

$value = Currency::create($amount, $fromCode);
$convertedValue = $this->converter->convert($value, $toCode);

return $convertedValue->getAmountAsString();
```

## 2. Comparación entre la versión anterior y la final

**Versión anterior:** `RateService.php`, `SyncManager.php` y `ConvertType.php` como vienen en EspoCRM 10.1.1 (commit `6f0495a8c2`, antes de cualquier corrección). **Versión final:** las tres clases corregidas. La misma suite de regresión ([`R-CUR_monedas_tasas.regression.cy.js`](../../../cypress/e2e/cur/regression/R-CUR_monedas_tasas.regression.cy.js), 20 casos) se ejecutó contra las dos.

| Caso | Entrada | Versión anterior | Versión final |
| :--- | :--- | :--- | :--- |
| R-CUR.A1 | `PUT {"COP":0}` | ✘ 200, se guarda 0 | ✔ 400 |
| R-CUR.A2 | `PUT {"COP":"abc"}` | ✘ 500 (página de error HTML) | ✔ 400 |
| R-CUR.A3 | `PUT {"COP":true}` | ✘ 200, se guarda 1 | ✔ 400 |
| R-CUR.A4 | `PUT {"COP":0.00009}` | ✘ 200 | ✔ 400 |
| R-CUR.A5 | `PUT [1,2]` | ✘ 200 | ✔ 400 |
| R-CUR.A6 | `PUT {"COP":-0.5}` | ✘ 400 con «Bad value.» | ✔ 400 con la moneda y el mínimo |
| R-CUR.B3 | `PUT 0` y luego convertir | ✘ 500 en la conversión | ✔ 400 y la conversión sigue en 200 |
| R-CUR.D1 | `convert(100, 'USD', 'EUR')` | ✘ **500** | ✔ 200, «Currency 'EUR' is not configured.» |
| R-CUR.D2 | `convert(100, 'usd', 'cop')` | ✘ **500** | ✔ 200, «Currency 'usd' is not configured.» |
| R-CUR.D3 | `convert('abc', 'USD', 'COP')` | ✘ **500** | ✔ 200, «The amount 'abc' is not a number.» |
| 10 casos de contrato, conversión, permisos y sincronización | — | ✔ | ✔ |
| **Total** | | **10 / 20** | **20 / 20** |

Fuentes: [`antes/regresion.txt`](antes/regresion.txt), [`antes/junit-regresion.xml`](antes/junit-regresion.xml), [`despues/regresion.txt`](despues/regresion.txt), [`despues/junit-regresion.xml`](despues/junit-regresion.xml).

| Métrica | Versión anterior | Versión final |
| :--- | :--- | :--- |
| Defectos abiertos del módulo | 5 (DEF-CUR-01 a 05) + OBS-CUR-06 | **0** |
| Respuestas 500 provocables desde la API del módulo | 4 (fórmula con moneda desconocida, con minúsculas o con texto, y `PUT` con texto) | **0** |
| Pruebas unitarias del módulo | 57 | **78** (todas pasan; 7 omitidas, se corren aparte sin bcmath) |
| Cobertura de líneas `RateService` / `SyncManager` / `ConvertType` | 100 % / 100 % / no medido | **100 % / 100 % / 100 %** |

## 3. Despliegue final

El despliegue usa la imagen del proyecto (`Dockerfile` sobre `espocrm/espocrm`) con el código del módulo montado desde el repositorio (`docker-compose.yml`: `application/Espo/Tools/Currency` y `application/Espo/Core/Formula/Functions/ExtGroup/CurrencyGroup`, en `espocrm` y `espocrm-daemon`).

```bash
docker compose up -d --force-recreate espocrm espocrm-daemon
```

```bash
docker exec espocrm sh -c "cd /var/www/html && php clear_cache.php"
```

Resultado: contenedores recreados y la aplicación respondió **HTTP 200** ([`despues/despliegue.txt`](despues/despliegue.txt)).

## 4. Pruebas posteriores al despliegue

| Suite | Resultado | Evidencia |
| :--- | :--- | :--- |
| Unitarias del módulo (PHPUnit, con cobertura) | **78 pasan**, 230 aserciones (7 omitidas) | [`despues/unitarias.txt`](despues/unitarias.txt) |
| Unitarias sin bcmath (`php -n`) | **7 / 7** | [`despues/unitarias-sin-bcmath.txt`](despues/unitarias-sin-bcmath.txt) |
| Regresión (Cypress) | **20 / 20** | [`despues/regresion.txt`](despues/regresion.txt) |
| Interfaz y API (Cypress) | **46 / 46** | [`despues/cypress-cur.txt`](despues/cypress-cur.txt) |
| Gherkin, BDD y Screenplay | **37 / 37** | [`despues/bdd.txt`](despues/bdd.txt) |
| Accesibilidad | **19 / 19** | [`despues/accesibilidad.txt`](despues/accesibilidad.txt) |
| Seguridad (DAST) | **20 / 20** | [`despues/seguridad.txt`](despues/seguridad.txt) |

Las suites de Cypress y BDD se actualizaron para la versión final: DEF-CUR-01 y 02 ya no esperan un 500, sino el error de fórmula con su mensaje (CUR-F1, SEC-CUR-14 y el escenario Gherkin de datos inválidos).

## 5. Pendiente

- `zend.assertions = 1` en el contenedor (SEC-H-02): el `assert()` que causaba DEF-CUR-02 ya no existe, pero la configuración de PHP sigue siendo la de desarrollo. Recomendación: usar `php.ini-production` en la imagen.
- OBS-CUR-01 a 05 (símbolo «$» para COP, truncamiento en 14 decimales, monto que se borra en silencio) son comportamientos del núcleo de EspoCRM y quedan como recomendaciones de usabilidad ([docs/CUR/usabilidad](../usabilidad/README.md)).
