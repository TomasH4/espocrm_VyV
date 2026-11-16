# Alcance individual: módulo Moneda y tasas de cambio (CUR)

Proyecto de Validación y Verificación sobre EspoCRM. Reemplaza al módulo anterior de seguridad (SEC-F1..F5), que se abandona. Los IDs de este módulo son **CUR-F1..CUR-F5**.

- **Producto bajo prueba:** EspoCRM 10.1.x (repo en 10.1.0, imagen Docker `espocrm/espocrm:latest` en 10.1.1). Los 9 archivos del módulo son idénticos entre repo e imagen (comparados por MD5 el 15-nov-2026).
- **Módulo:** conversión, aritmética y gestión de tasas de moneda: `Espo\Core\Currency`, `Espo\Tools\Currency`, `Espo\Core\Field\Currency`, `Espo\Classes\FieldValidators\CurrencyType` y la función de fórmula `ext\currency\convert`.
- **Fuera de alcance (no se cuentan como funcionalidad):** inicio de sesión, CRUD de usuarios y CRUD de entidades. Las entidades `Campaign` (campo `budget`) y `CurrencyRecordRate` se usan solo como vehículo de prueba, no como objeto de prueba.
- **Sin servicios externos:** la sincronización automática de tasas con un proveedor externo no se prueba; todo es determinista.

## Compañeros y no solapamiento

| Integrante | Módulos | Choque con CUR |
|---|---|---|
| TomasH4 | Lead, Opportunity (probabilidad), Contact, Meeting, LeadConversion (`application/Espo/VyV/`) | Ninguno. Opportunity tiene un campo moneda, pero su F2 calcula probabilidad, no importes. |
| Andrés | Cases (estados, SLA), Quotes (descuentos), Tasks (vencidas), Accounts (duplicados) | Posible en su F3 (descuentos) si usa `CalculatorUtil`, `Converter` o `Rates`. **Por confirmar con él.** `Quote` no existe en el código del repo (es del Sales Pack). |

## Funcionalidades

V(G) es una estimación por lectura de código, contando cada `if`, `&&`, `||`, `??` y `catch` como punto de decisión; se confirmará con una herramienta (PHPStan/pdepend).

| ID | Funcionalidad | Código principal | V(G) | Punto de entrada para E2E/API |
|---|---|---|---|---|
| **CUR-F1** | Conversión de montos entre monedas | `Core/Currency/Converter.php` (`convert`, `convertWithRates`, `convertToDefault`) y `Core/Formula/Functions/ExtGroup/CurrencyGroup/ConvertType.php` | `convert` 2, `convertWithRates` 3, `ConvertType::process` 8 | Admin → Formula Sandbox (`#Admin/formulaSandbox`), fórmula `ext\currency\convert(MONTO, DESDE, HACIA)` |
| **CUR-F2** | Aritmética decimal exacta de montos | `Core/Currency/CalculatorUtil.php` y `Core/Field/Currency.php` (`add`, `subtract`, `multiply`, `divide`, `round`, `compare`) | `add`/`subtract`/`multiply`/`compare` 2, `divide` 3, `round` 3 | Indirecto: la misma fórmula de F1 (precisión de 14 decimales). Es la funcionalidad con más peso unitario. |
| **CUR-F3** | Validación de campos de moneda (formato, rango permitido, código de moneda válido) | `Classes/FieldValidators/CurrencyType.php` (`checkValid`, `checkInPermittedRange`, `checkValidCurrency`) | `isNotEmpty` 5, `checkValid` 4, `checkInPermittedRange` 7, `checkValidCurrency` 9 | Formulario y API de `Campaign.budget` (`POST/PUT /api/v1/Campaign` devuelve 400 si no valida) |
| **CUR-F4** | Consulta y actualización de tasas con control de permisos | `Tools/Currency/RateService.php` (`get`, `set`, `writeOne`, `checkReadAccess`, `checkEditAccess`) y `Api/Get.php`, `Api/PutUpdate.php` | `get` 2, `set` 5, `writeOne` 3, `checkReadAccess`/`checkEditAccess` 3 | `GET` y `PUT /api/v1/CurrencyRate`. **Solo API:** el cliente web no llama a esta ruta (la pantalla Admin → Currency guarda por Settings). |
| **CUR-F5** | Sincronización de las tasas vigentes hacia la configuración | `Tools/Currency/SyncManager.php` (`sync`, `refreshCache`, `updateCode`, `deactivateNotListed`) | `syncCode` 2, `updateCode` 2, `clearCache` 2, resto 1 | Se dispara al guardar o borrar un `CurrencyRecordRate` (hooks `AfterSave`/`AfterDelete`), por el job `SyncCurrencyRates` y por el rebuild. Se observa con `GET /api/v1/CurrencyRate`. |

Cambios respecto a la propuesta enviada antes: (a) la antigua "gestión del conjunto de tasas" (`Rates`) es un objeto de valor muy pequeño y se absorbe en F4; en su lugar entra la validación de campos de moneda (F3), que sí tiene interfaz y API; (b) la antigua F5 estaba mal descrita: `updateCode` no cambia la moneda base, vuelve a leer la última tasa de una moneda y la escribe en la configuración.

## Pruebas que ya trae EspoCRM (no se duplican)

| Área | Existente | Qué falta |
|---|---|---|
| F1 | `tests/unit/Espo/Core/Field/Currency/CurrencyConverterTest.php` (4 casos felices) | Caminos de error, tasa cero, moneda sin tasa, argumentos de la fórmula |
| F2 | `tests/unit/Espo/Core/Field/Currency/CurrencyTest.php` (25 casos del objeto de valor) | Ninguna prueba directa de `CalculatorUtil`: redondeo con negativos, escala de 14 decimales, división por cero |
| F3 | Ninguna | Todo |
| F4 | `tests/integration/Espo/Currency/CurrencyTest.php::testSetCurrencyRates` (la integración no está configurada en este entorno) | Permisos, valores límite, cuerpo inválido |
| F5 | Ninguna unitaria | Todo |

## Hallazgos preliminares (candidatos a defecto y a TDD)

Comprobados el 15-nov-2026 ejecutando el código de la imagen en el contenedor, salvo donde se indica.

1. **Mensajes de excepción sin comilla de cierre** en `Converter.php` (líneas 56, 78 y 82), por ejemplo `No rate for the currency 'XXX.`. Confirmado. Defecto menor, buen candidato para el ciclo TDD (rojo → verde → refactor).
2. **Tasa cero:** `RateService::set()` solo rechaza valores `< 0`, así que acepta `0` (lectura de código). Con una tasa `0`, convertir hacia esa moneda lanza `DivisionByZeroError`, que no es la `RuntimeException` documentada, y convertir desde ella devuelve `0` sin avisar. Confirmado a nivel de `Converter`; falta confirmarlo de extremo a extremo con `PUT /CurrencyRate`.
3. **Cuerpo no válido en `PUT /CurrencyRate`:** `get_object_vars` sobre un cuerpo que no es objeto y `writeOne(string, float)` con valores no numéricos probablemente producen 500 en vez de 400. **Por verificar.**
4. **Código inalcanzable** (útil para el análisis de caja blanca): las ramas de respaldo sin `bcmath` (`function_exists('bcadd')` es `true` en el contenedor, PHP 8.4.27) y la rama `$result === null` de `CalculatorUtil::divide`, porque `bcdiv` ya lanza `DivisionByZeroError`. Confirmado.

## Entorno y datos de prueba

- Docker local (`espocrm`, `espocrm-daemon`, `espocrm-mysql`), app en `http://localhost:8080`.
- La instancia solo tiene **USD** configurada (`GET /api/v1/CurrencyRate` devuelve `{"USD":1}`). Para probar conversiones hay que añadir antes más monedas (p. ej. EUR, COP) y sus tasas desde Admin → Currency. Es un paso de preparación del entorno.
- El módulo vive en el código de la imagen, no en el del repo; para el ciclo TDD hay que montar la ruta que se modifique (ver nota del entorno Docker).

## Mapa de pruebas por funcionalidad (propuesta)

| Tipo de prueba (rúbrica) | F1 | F2 | F3 | F4 | F5 |
|---|---|---|---|---|---|
| Caja blanca (grafo, V(G), caminos) | sí | sí (con ramas inalcanzables) | sí | sí | sí |
| Caja negra (particiones, límites) | sí | sí | sí | sí | parcial |
| Unitarias con dobles | sí | sí | sí | sí | sí (mocks de EntityManager y Config) |
| API (Postman/Newman o `cy.request`) | fórmula | indirecta | `Campaign` | `CurrencyRate` | observación vía GET |
| Cypress E2E | Formula Sandbox | Formula Sandbox | formulario `Campaign` | **solo API** | indirecta |

## Riesgos y preguntas abiertas

- **¿Cuenta como CRUD?** F4 es lectura y escritura de tasas (un recurso de configuración, no un CRUD de entidad) y F3 se prueba sobre `Campaign`. Si el profesor lo considera CRUD, F4 sería la candidata a sustituir.
- **F2 e F5 tienen interfaz indirecta.** Para el criterio 7 (Cypress por funcionalidad) se probarán con la fórmula y con la API; conviene confirmar que se acepta.
- **Solapamiento con la F3 de Andrés (descuentos):** pendiente de preguntarle si usa `CalculatorUtil`, `Converter` o `Rates`.
- **Versión a declarar:** repo 10.1.0 frente a imagen 10.1.1, sin decidir.
