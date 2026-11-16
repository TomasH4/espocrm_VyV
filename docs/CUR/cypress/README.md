# CUR — Pruebas automatizadas con Cypress (interfaz y API)

**Criterio de la rúbrica:** 7 (Cypress y pruebas de API). **Módulo:** Moneda y tasas de cambio (CUR-F1 a CUR-F5).
**Fecha de ejecución:** 15 de noviembre de 2026. **Resultado:** 46 pruebas, 46 pasan ([`ejecucion-final.txt`](ejecucion-final.txt)).

## 1. Archivos

| Archivo | Qué contiene |
| :--- | :--- |
| `cypress/support/cur.js` | Comandos propios del módulo: `curApi`, `curFormula`, `curConvert`, `curSetCopRate`, `curCreateRegularUser`, `curCopRecordId`, `curTypeFormula`. Cada spec lo importa, así que `cypress/support/commands.js`, compartido por el equipo, no se modificó |
| `cypress/e2e/cur/CUR-F1_conversion.cy.js` | Conversión: Formula Sandbox por la interfaz y `POST /Formula/action/run` |
| `cypress/e2e/cur/CUR-F2_aritmetica.cy.js` | Exactitud decimal, escala de 14 decimales e ida y vuelta |
| `cypress/e2e/cur/CUR-F3_validacion_moneda.cy.js` | Formulario de Campaign por la interfaz y `POST /Campaign` |
| `cypress/e2e/cur/CUR-F4_api_tasas.cy.js` | `GET` y `PUT /CurrencyRate` con administrador, usuario normal y sin autenticar |
| `cypress/e2e/cur/CUR-F5_sincronizacion.cy.js` | API de `CurrencyRecordRate` (hooks) y panel Rates de Currencies › COP |

## 2. Cómo ejecutarlas

Requisitos: contenedores levantados (`docker compose up -d`) y dependencias de Node instaladas.

```bash
npm ci --ignore-scripts
```

```bash
npx cypress install
```

```bash
npx cypress run --spec "cypress/e2e/cur/*.cy.js" --config trashAssetsBeforeRuns=false
```

- `--ignore-scripts` es necesario en Windows: el script de instalación de `phantomjs`, una dependencia antigua del proyecto, falla y detiene `npm ci`. Por eso el binario de Cypress se instala aparte, con `npx cypress install` (quedó la versión 15.21.2).
- `trashAssetsBeforeRuns=false` evita un error de Cypress al mandar a la papelera las capturas viejas dentro de la carpeta de OneDrive.
- **Credenciales:** se usa el administrador de `cypress.config.js` (`username` y `password`). Para usar otro, se definen las variables de entorno `CYPRESS_curUser` y `CYPRESS_curPassword`. No hay credenciales nuevas escritas en el código.

## 3. Diseño

- **AAA y FIRST.**
  - **Repetibles:** cada spec deja la tasa de COP en 0.00025 antes de cada prueba (`curSetCopRate`) y la restablece al final.
  - **Independientes:** el usuario normal para los casos de permisos se crea en cada ejecución, con contraseña generada, y se borra al terminar. Las campañas y tasas que crean las pruebas también se borran.
  - **Rápidas:** el inicio de sesión de la interfaz se reutiliza con `cy.session` (comando `loginViaApi` del equipo).
- **Casos ligados a la caja negra.** Cada prueba lleva el identificador CN-CUR del Excel *Casos y Escenarios EspoCRM*, el tipo de escenario (exitoso, alternativo o error) y, si aplica, el defecto o la observación.
- **Defectos abiertos.**
  - DEF-CUR-01 y DEF-CUR-02 siguen sin corregir. Sus pruebas verifican el comportamiento actual (500) y lo nombran «abierto», para que la suite quede en verde y el defecto no se pierda de vista.
  - DEF-CUR-03 y DEF-CUR-04 ya se corrigieron con TDD ([docs/CUR/tdd](../tdd/README.md)). Sus pruebas verifican la corrección (400).

## 4. Casos automatizados

| Spec | Interfaz | API | Exitosos | Alternativos | Error | Casos del Excel |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| CUR-F1 | 2 | 7 | 4 | 1 | 4 | CN-CUR-F1-01, 02, 03, 06, 11, 13, 17 |
| CUR-F2 | — | 4 | 3 | 1 | — | CN-CUR-F2-01, 02, 05, 08 |
| CUR-F3 | 3 | 7 | 3 | 2 | 5 | CN-CUR-F3-01, 03, 08, 09, 10, 11, 13, 14, 15, 19 |
| CUR-F4 | — | 15 | 3 | 2 | 10 | CN-CUR-F4-01 a 13, valor límite 0.0001 y 0.00009, booleano `true` |
| CUR-F5 | 3 | 5 | 2 | 2 | 4 | CN-CUR-F5-03 a 06, 08 a 10, ESC-CUR-F5-06 |
| **Total** | **8** | **38** | **15** | **8** | **23** | **46 pruebas** |

Las pruebas de interfaz cubren:
- el Formula Sandbox: CUR-F1-01 y el error de DEF-CUR-01;
- el formulario de Campaign: guardar 1000.50 USD, letras en el monto y monedas del selector;
- el formulario de tasas de Currencies › COP: Rate −1, 0 y 0.00009 se rechazan sin enviar ninguna petición, lo que se comprueba interceptando el POST.

## 5. Resultados

| Spec | Pruebas | Pasan | Duración |
| :--- | :---: | :---: | :---: |
| CUR-F1_conversion | 9 | 9 | 38 s |
| CUR-F2_aritmetica | 4 | 4 | 9 s |
| CUR-F3_validacion_moneda | 10 | 10 | 39 s |
| CUR-F4_api_tasas | 15 | 15 | 54 s |
| CUR-F5_sincronizacion | 8 | 8 | 64 s |
| **Total** | **46** | **46** | **3 min 27 s** |

## 6. Hallazgos durante la automatización

- **OBS-CUR-06 quedó resuelta por el TDD.** EspoCRM convierte el cuerpo `[1,2]` en `{"list":[1,2]}`. `validateRate()` ahora rechaza ese valor no numérico con 400, cuando en la caja negra respondía 200. La prueba CN-CUR-F4-11 se actualizó y el cambio quedó registrado en [docs/CUR/tdd](../tdd/README.md#8-nueva-prueba-por-la-api).
- **Ajustes en las primeras ejecuciones:** dos aserciones mal planteadas, ninguna por fallos de la aplicación.
  - El motivo de los errores de validación va en la cabecera `X-Status-Reason` («Field validation failure; entityType: Campaign, field: budget, type: valid.»).
  - El selector de moneda es un control Selectize: el `<select>` original solo conserva la opción elegida y la lista completa (USD y COP) está en `selectize.options`.
- **Fecha del servidor:** EspoCRM usa la hora UTC para «hoy». Si las pruebas corren después de las 19:00 en Colombia, `PUT /CurrencyRate` crea la tasa del día siguiente. No cambia los resultados, porque la tasa vigente es la más reciente con fecha menor o igual a hoy.

## 7. Pendiente

- DEF-CUR-05 (sin tasa vigente la configuración queda en 1) no se automatiza en Cypress, porque obliga a borrar la tasa vigente del entorno compartido. Está cubierto por `RateSyncTest::testDefCur05SinTasaVigenteEscribeUno`.
- Gherkin, BDD y Screenplay (criterio 8): estos casos pueden pasarse a `tests_bdd_screenplay/features`, siguiendo el formato del equipo.
