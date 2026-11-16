# CUR — Ciclo TDD: validación de tasas en `PUT /api/v1/CurrencyRate`

**Criterio de la rúbrica:** 6 (TDD y pruebas unitarias). **Funcionalidad:** CUR-F4, consulta y actualización de tasas.
**Fecha:** 15 de noviembre de 2026. **Archivo corregido:** `application/Espo/Tools/Currency/RateService.php`.
**Pruebas:** `tests/unit/Espo/VyV/Currency/RateServiceTest.php`.

## 1. Qué se corrige y por qué

La caja negra (Excel, hoja *Casos Detallado*) y la caja blanca ([CUR-F4](../CUR-F4/caja-blanca.md), nodo 5 de `set()`) mostraron que la API valida las tasas con una regla más débil que la del formulario:

| Defecto | Caso de caja negra | Antes de la corrección |
| :--- | :--- | :--- |
| **DEF-CUR-04** Tasa menor que el mínimo | CN-CUR-F4-07 `{"COP":0}` | 200: se guarda 0 y después la conversión a COP divide por cero |
| **DEF-CUR-03** Tasa no numérica | CN-CUR-F4-08 `{"COP":"abc"}` | 500: `TypeError` al llamar `writeOne(string, float)` |
| **Nuevo, visto en el rojo del ciclo 2** | — `{"COP":true}` | Se guarda como tasa 1 sin avisar |

El formulario de tasas exige un número mayor o igual a 0.0001 (`entityDefs/CurrencyRecordRate.json`, campo `rate`, `min: 0.0001`). La mejora hace que la API aplique la misma regla y responda 400 con un mensaje claro.

## 2. Entorno

- El contenedor `espocrm` corre el código de la imagen 10.1.1. Para que ejecute la corrección se montó la carpeta `application/Espo/Tools/Currency` en `docker-compose.yml` (servicios `espocrm` y `espocrm-daemon`). Antes de montarla se comprobó por MD5 que los 10 archivos de la carpeta eran idénticos en la imagen y en el repo.
- PHPUnit 11.5.58, PHP 8.4.27, Xdebug 3.5.3.
- Las dependencias de `RateService` (Acl, ConfigDataProvider, SyncManager, RateEntryProvider, DateTime, EntityManager, DatabasePopulator y Metadata) son dobles de prueba (`createMock`). Así la prueba no toca la base de datos.

```bash
docker exec espocrm sh -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/Currency/RateServiceTest.php --no-coverage --testdox"
```

Las salidas completas de cada fase están en [`salidas/`](salidas/).

## 3. Ciclo 1 — DEF-CUR-04: tasa mínima

### Rojo

Se reemplazó la prueba que describía el defecto (`testDefCur04LaTasaCeroSeGuarda`) por las del comportamiento correcto:

- `testTasaPorDebajoDelMinimoEsBadRequest`, con un proveedor de datos: `0` (CN-CUR-F4-07), `0.00009` (justo debajo del mínimo) y `0.000001`. Espera `BadRequest` y que no se guarde ni se refresque nada.
- `testTasaIgualAlMinimoSeGuarda`: el valor límite `0.0001` sí se guarda.

Resultado ([`ciclo1-rojo.txt`](salidas/ciclo1-rojo.txt)): **16 pruebas, 3 fallos**. Fallan las tres tasas por debajo del mínimo. La del valor límite ya pasaba, porque el código anterior no lo rechaza.

### Verde

El cambio mínimo que hace pasar las pruebas ([`ciclo1-verde.diff`](salidas/ciclo1-verde.diff)):

```diff
-            if ($value < 0) {
+            if ($value < 0.0001) {
```

Resultado ([`ciclo1-verde.txt`](salidas/ciclo1-verde.txt)): **16 pruebas, 63 aserciones, todas pasan**.

## 4. Ciclo 2 — DEF-CUR-03: tasa no numérica

### Rojo

Se reemplazó `testDefCur03TextoProvocaTypeError` por:

- `testTasaNoNumericaEsBadRequest`, con un proveedor de datos: `'abc'` (CN-CUR-F4-08), `true`, `[1]` y un objeto JSON. Espera `BadRequest` y que no se guarde nada.
- `testTasaEnTextoNumericoSeGuarda`: `'0.0003'` (número enviado entre comillas) se sigue aceptando.

Resultado ([`ciclo2-rojo.txt`](salidas/ciclo2-rojo.txt)): **20 pruebas, 4 fallos**.
- `'abc'`, el arreglo y el objeto fallan con `TypeError`, que es el 500 de DEF-CUR-03.
- `true` falla de otra forma: `saveEntity()` se llamó cuando no debía. La comparación `true < 0.0001` es falsa y PHP convierte `true` en 1.0 al pasarlo a `writeOne(…, float)`. Es un defecto que la caja negra no había probado.

### Verde

([`ciclo2-verde.diff`](salidas/ciclo2-verde.diff))

```diff
-            if ($value < 0.0001) {
+            if (!is_numeric($value) || $value < 0.0001) {
```

Resultado ([`ciclo2-verde.txt`](salidas/ciclo2-verde.txt)): **20 pruebas, 75 aserciones, todas pasan**.

## 5. Refactorización

Con las pruebas en verde se mejoró el diseño sin cambiar el comportamiento ([`refactor.diff`](salidas/refactor.diff)):

1. **Método propio `validateRate()`.** La regla sale del bucle de `set()` y cada fallo tiene su mensaje: *the rate must be a number* o *the rate must not be less than 0.0001*.
2. **El mínimo viene de la definición del campo.** `getMinRate()` lee `entityDefs.CurrencyRecordRate.fields.rate.min` mediante `Metadata`, la misma fuente que usa el formulario. Si se cambia el mínimo, la API y la pantalla siguen iguales. Si la definición no existe, se usa `DEFAULT_MIN_RATE = 0.0001`.
3. **`Metadata` se agrega al constructor.** EspoCRM lo inyecta solo (autowiring por tipo), así que no hay que registrar nada más.

Dos pruebas nuevas cubren lo que agregó la refactorización:
- `testElMinimoSaleDeLaDefinicionDelCampo`: con mínimo 0.001, la tasa 0.0005 se rechaza y el mensaje cita 0.001.
- `testSinMinimoDefinidoSeUsaElValorPorDefecto`.

Resultado ([`refactor-verde.txt`](salidas/refactor-verde.txt)): **22 pruebas, 98 aserciones, todas pasan**.

```php
    private function validateRate(string $code, mixed $value, float $minRate): void
    {
        if (!is_numeric($value)) {
            throw new BadRequest("Bad value for '$code': the rate must be a number.");
        }

        if ($value < $minRate) {
            throw new BadRequest("Bad value for '$code': the rate must not be less than $minRate.");
        }
    }
```

## 6. Buenas prácticas aplicadas

| Práctica | Cómo se aplica |
| :--- | :--- |
| **AAA** | Las pruebas del ciclo marcan *Arrange*, *Act* y *Assert*. Como `expectException` se declara antes de actuar, se rotula «Assert (esperado)» |
| **FIRST** | Rápidas: 22 pruebas en menos de 0.2 s. Independientes: `setUp` crea dobles nuevos en cada prueba. Repetibles: la fecha de hoy es un doble fijo (15-11-2026) y no se usa la base de datos. Autoevaluadas: solo aserciones, sin revisión manual. Oportunas: cada prueba se escribió antes de su corrección |
| **Test Doubles** | Mocks con expectativas (`expects($this->never())->method('saveEntity')`, `->with('0.0001')`) y stubs (`willReturn`) para las 8 dependencias |
| **Valores límite** | 0.00009 / 0.0001 alrededor del mínimo; 0 y negativos |
| **Proveedores de datos** | `#[DataProvider]` con nombres que citan el caso de caja negra |

## 7. Regresión

| Suite | Antes de la corrección | Después de la corrección |
| :--- | :--- | :--- |
| Unitaria del módulo CUR (`phpunit-cur.xml`) | 57 pruebas, todas pasan (7 omitidas, sin bcmath) | **66 pruebas, 199 aserciones, todas pasan** (7 omitidas) |
| Unitaria completa del proyecto (sin `RateServiceTest`) | 1960 pruebas, 397 errores | 1960 pruebas, **los mismos 397 errores** |

Los 397 errores de la suite completa ya existían antes de la corrección y están en 20 clases del núcleo que no tocan el módulo: Formula, File Manager, Upgrades, Language, entre otras. Se comprobó así: con el `RateService.php` original la suite da exactamente el mismo resultado ([`regresion-suite-unit-ANTES.txt`](salidas/regresion-suite-unit-ANTES.txt) y [`…DESPUES.txt`](salidas/regresion-suite-unit-DESPUES.txt)). La corrección no introduce regresiones.

**Cobertura** ([`regresion-cur-cobertura.txt`](salidas/regresion-cur-cobertura.txt)): `RateService` 8/8 métodos y 38/38 líneas (100 %). El resto del módulo no cambia: `CurrencyType`, `SyncManager` y los hooks 100 %; `CalculatorUtil` 18/28, porque las ramas sin bcmath se prueban aparte con `php -n`.

```bash
docker exec espocrm sh -c "cd /var/www/html && XDEBUG_MODE=coverage phpunit -c tests/unit/Espo/VyV/Currency/phpunit-cur.xml --coverage-text"
```

## 8. Nueva prueba por la API

Se repitieron contra la aplicación en ejecución (`http://localhost:8080`, usuario administrador) los casos de caja negra afectados, más los de control ([`api-despues.txt`](salidas/api-despues.txt)):

| Caso | Cuerpo | Antes | Después |
| :--- | :--- | :--- | :--- |
| CN-CUR-F4-07 | `{"COP":0}` | 200, se guarda 0 (Fallido) | **400** «the rate must not be less than 0.0001» |
| CN-CUR-F4-08 | `{"COP":"abc"}` | 500 (Fallido) | **400** «the rate must be a number» |
| Nuevo | `{"COP":true}` | se guarda 1 (visto en la prueba unitaria) | **400** |
| Nuevo | `{"COP":0.00009}` | 200 | **400** |
| CN-CUR-F4-06 (control) | `{"COP":-0.5}` | 400 | 400 |
| CN-CUR-F4-09 (control) | `{"EUR":0.9}` | 200, sin cambios | 200, sin cambios |
| Límite | `{"COP":0.0001}` | 200 | 200, y GET devuelve `COP: 0.0001` |
| CN-CUR-F4-11 | `[1,2]` | 200 sin cambios (OBS-CUR-06) | **400** «Bad value for 'list': the rate must be a number» |

**Efecto adicional encontrado con Cypress:** EspoCRM convierte el cuerpo `[1,2]` en `{"list":[1,2]}`. Como `validateRate()` se ejecuta antes de descartar las monedas que no aplican, ese cuerpo ahora responde 400. OBS-CUR-06 pedía justamente eso, así que queda resuelta. Lo verifican `cypress/e2e/cur/CUR-F4_api_tasas.cy.js` y la consulta con curl.

Al terminar se restauró la tasa de COP de hoy a 0.00025.

## 9. Pendiente

- **DEF-CUR-05** (sin tasa vigente la configuración queda en 1) no se corrigió en este ciclo. `RateSyncTest::testDefCur05SinTasaVigenteEscribeUno` sigue describiendo el comportamiento actual.
- Actualizar en el Excel el resultado de CN-CUR-F4-07 y 08 como reprueba (criterio 10, regresión).
- El montaje nuevo de `docker-compose.yml` afecta a todo el equipo: con él, el contenedor usa la carpeta `Tools/Currency` del repo.
