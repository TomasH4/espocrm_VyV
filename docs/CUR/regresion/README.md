# CUR — Pruebas de regresión tras corregir DEF-CUR-03 y DEF-CUR-04

**Criterio de la rúbrica:** 10 (Regresión). **Fecha:** 16 de noviembre de 2026.
**Cambio evaluado:** validación de tasas en `RateService::set()`, hecha con TDD (commit `645aa9a59d`, [docs/CUR/tdd](../tdd/README.md)).
**Excel:** hoja nueva *Regresión CUR* en *Casos y Escenarios EspoCRM.xlsx*. Los resultados originales de la caja negra no se modificaron, porque son la línea base.

## 1. Selección de casos

La suite de regresión ([`cypress/e2e/cur/regression/R-CUR_monedas_tasas.regression.cy.js`](../../../cypress/e2e/cur/regression/R-CUR_monedas_tasas.regression.cy.js)) sigue el formato del equipo (`[Regresión …]`, carpeta `cypress/e2e/cur/regression`). Sus casos se eligieron según el riesgo del cambio:

| Grupo | Por qué se eligió | Casos |
| :--- | :--- | :--- |
| **RC-A** Validación (código modificado) | Pasan directamente por `validateRate()`: deben cambiar al resultado correcto (los defectos) o mantenerse (los contratos) | A1 a A10: CN-CUR-F4-04, 06, 07, 08, 09, 10, 11; valores límite 0.0001 y 0.00009; `true`; texto numérico |
| **RC-B** Conversión (consumidores) | CUR-F1 y CUR-F2 usan la tasa que escribe la API | B1 CN-CUR-F1-01, B2 CN-CUR-F2-05, B3 efecto de CN-CUR-F4-07 en la conversión |
| **RC-C** Flujos vecinos | Comparten el servicio o la configuración, pero el cambio no debería tocarlos | C1 permisos 403, C2 sin autenticar 401, C3 sincronización por hooks (CN-CUR-F5-03) |

## 2. Procedimiento

La misma suite se ejecutó dos veces contra la aplicación en Docker (http://localhost:8080):
- **Antes:** con el `RateService.php` del commit anterior a la corrección (`git show 645aa9a59d^:…`).
- **Después:** con el código corregido.

El contenedor usa el código del repo gracias al montaje de `application/Espo/Tools/Currency` en `docker-compose.yml`. El script restauró el archivo corregido al terminar; se comprobó con `git diff`, que no muestra cambios.

```bash
npx cypress run --spec "cypress/e2e/cur/regression/R-CUR_monedas_tasas.regression.cy.js" --config trashAssetsBeforeRuns=false
```

Las demás suites automatizadas del módulo y del proyecto también se repitieron después de la corrección:

```bash
docker exec espocrm sh -c "cd /var/www/html && XDEBUG_MODE=coverage phpunit -c tests/unit/Espo/VyV/Currency/phpunit-cur.xml --coverage-text"
```

```bash
docker exec espocrm sh -c "cd /var/www/html && phpunit --testsuite unit --no-coverage"
```

```bash
npx cypress run --spec "cypress/e2e/cur/*.cy.js" --config trashAssetsBeforeRuns=false
```

## 3. Resultados comparativos

### Suite de regresión, caso por caso

Fuentes: [`junit-antes.xml`](junit-antes.xml) y [`junit-despues.xml`](junit-despues.xml).

| Caso | Entrada | Antes | Después | Conclusión |
| :--- | :--- | :--- | :--- | :--- |
| R-CUR.A1 CN-CUR-F4-07 | `{"COP":0}` | ✘ 200, se guarda 0 | ✔ 400 | DEF-CUR-04 corregido |
| R-CUR.A2 CN-CUR-F4-08 | `{"COP":"abc"}` | ✘ 500 | ✔ 400 | DEF-CUR-03 corregido |
| R-CUR.A3 | `{"COP":true}` | ✘ 200, se guarda 1 | ✔ 400 | Defecto hallado en el TDD, corregido |
| R-CUR.A4 | `{"COP":0.00009}` | ✘ 200 | ✔ 400 | DEF-CUR-04 corregido (valor límite) |
| R-CUR.A5 CN-CUR-F4-11 | `[1,2]` | ✘ 200 | ✔ 400 | OBS-CUR-06 resuelta |
| R-CUR.A6 CN-CUR-F4-06 | `{"COP":-0.5}` | ✘ 400 con el mensaje genérico «Bad value.» | ✔ 400 con un mensaje que nombra la moneda y el mínimo | El resultado ya era correcto; mejora el mensaje |
| R-CUR.A7 CN-CUR-F4-04 | `{"COP":0.00026}` | ✔ | ✔ | Sin regresión |
| R-CUR.A8 | `{"COP":0.0001}` | ✔ | ✔ | Sin regresión (el límite se acepta) |
| R-CUR.A9 CN-CUR-F4-09/10 | `{"EUR":0.9,"USD":2}` | ✔ | ✔ | Sin regresión |
| R-CUR.A10 | `{"COP":"0.0003"}` | ✔ | ✔ | Sin regresión (el texto numérico se acepta) |
| R-CUR.B1 CN-CUR-F1-01 | 100 USD → COP | ✔ | ✔ | Sin regresión |
| R-CUR.B2 CN-CUR-F2-05 | PUT 0.0003; 1 USD → COP | ✔ | ✔ | Sin regresión |
| R-CUR.B3 | PUT 0; 100 USD → COP | ✘ 500 en la conversión (división por cero) | ✔ PUT 400; conversión 200 | Consecuencia de DEF-CUR-04, eliminada |
| R-CUR.C1 CN-CUR-F4-02/12 | usuario normal | ✔ 403 | ✔ 403 | Sin regresión |
| R-CUR.C2 CN-CUR-F4-03/13 | sin autenticar | ✔ 401 | ✔ 401 | Sin regresión |
| R-CUR.C3 CN-CUR-F5-03 | editar la tasa por el registro | ✔ | ✔ | Sin regresión |
| **Total** | | **9 pasan, 7 fallan** | **16 pasan** | |

Los 7 fallos de «antes» son exactamente los casos que el cambio debía corregir. Los 9 casos de contrato, conversión, permisos y sincronización pasan igual en las dos ejecuciones.

### Todas las suites automatizadas

| Suite | Antes de la corrección | Después de la corrección |
| :--- | :--- | :--- |
| Regresión CUR (Cypress) | 9 / 16 | **16 / 16** |
| Módulo CUR, interfaz y API (Cypress) | — (escrita después del TDD) | **46 / 46** ([ejecución](../cypress/ejecucion-final.txt)) |
| Unitaria del módulo CUR (PHPUnit) | 57 pasan, 7 omitidas | **66 pasan**, 7 omitidas ([cobertura](../tdd/salidas/regresion-cur-cobertura.txt)) |
| Unitaria completa del proyecto (PHPUnit, sin `RateServiceTest`) | 1960 pruebas, 397 errores | 1960 pruebas, **los mismos 397 errores** |

Los 397 errores de la suite completa están en clases del núcleo que el módulo no usa (Formula, File Manager, Upgrades, Language, entre otras). Aparecen igual con el código original y con el corregido ([antes](regresion-suite-unit-ANTES.txt), [después](regresion-suite-unit-DESPUES.txt)), así que no son una regresión.

## 4. Conclusiones

- La corrección elimina DEF-CUR-03 y DEF-CUR-04, más el defecto de `true` hallado en el TDD, y de paso resuelve OBS-CUR-06.
- No hay regresiones en la conversión (CUR-F1 y CUR-F2), los permisos (CUR-F4) ni la sincronización por hooks (CUR-F5).
- **Cambio de contrato:** el mensaje de error de una tasa inválida ya no es «Bad value.». Ahora nombra la moneda y la regla: «Bad value for 'COP': …». Un cliente que dependiera del texto exacto tendría que ajustarse; el código HTTP sigue siendo 400.
- **Siguen abiertos:** DEF-CUR-01 y DEF-CUR-02 (errores 500 en la fórmula de conversión) y DEF-CUR-05 (sin tasa vigente la configuración queda en 1). Si se corrigen, esta misma suite y las de `cypress/e2e/cur` sirven para la regresión.
