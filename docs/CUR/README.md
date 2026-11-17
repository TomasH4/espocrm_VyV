# Módulo CUR — Moneda y tasas de cambio: guía de pruebas

**Integrante:** Alejandro Bustamante. **Producto:** EspoCRM 10.1.1 en Docker. **Rama:** `dev`.
Este documento resume cada criterio de la rúbrica ya completo: qué se hizo, para qué sirve, dónde está y cómo ejecutarlo.

## 1. Las cinco funcionalidades y dónde están en la aplicación

| ID | Funcionalidad | Código en el proyecto | Dónde se ve en la aplicación |
| :--- | :--- | :--- | :--- |
| CUR-F1 | Conversión de montos entre monedas | `application/Espo/Core/Formula/Functions/ExtGroup/CurrencyGroup/ConvertType.php` (función `ext\currency\convert`) y `application/Espo/Core/Currency/Converter.php` | Administration › Formula Sandbox (`http://localhost:8080/#Admin/formulaSandbox`) |
| CUR-F2 | Aritmética decimal exacta (14 decimales) | `application/Espo/Core/Currency/CalculatorUtil.php` | Indirecta: el resultado de cada conversión |
| CUR-F3 | Validación de campos de moneda | `application/Espo/Classes/FieldValidators/CurrencyType.php` (servidor) y `client/src/views/fields/currency.ts` (pantalla) | Formulario de Campaign, campo *Budget* (`#Campaign/create`) y `POST /api/v1/Campaign` |
| CUR-F4 | Consulta y actualización de tasas con permisos | `application/Espo/Tools/Currency/RateService.php`, `Api/Get.php` y `Api/PutUpdate.php` | Solo API: `GET` y `PUT /api/v1/CurrencyRate` |
| CUR-F5 | Sincronización de la tasa vigente con la configuración | `application/Espo/Tools/Currency/SyncManager.php`, `RateEntryProvider.php` y `application/Espo/Classes/RecordHooks/CurrencyRecordRate/AfterSave.php` / `AfterDelete.php` | Administration › Currency › Currencies › COP › panel *Rates* |

`docker-compose.yml` monta `application/Espo/Tools/Currency` y `application/Espo/Core/Formula/Functions/ExtGroup/CurrencyGroup` en el contenedor, para que la aplicación ejecute el código corregido del repositorio.

## 2. Preparar el entorno (una sola vez)

Desde la raíz del repositorio, en PowerShell o Git Bash:

```bash
docker compose up -d mysql espocrm espocrm-daemon
```

```bash
npm ci --ignore-scripts
```

```bash
npx cypress install
```

- La aplicación queda en `http://localhost:8080`. La moneda base es USD y COP vale 0.00025 USD; las pruebas restablecen ese valor solas.
- `--ignore-scripts` es necesario porque el script de instalación de `phantomjs`, una dependencia antigua del proyecto, falla en Windows.
- En Git Bash, antes de los comandos `docker exec`, ejecuta `export MSYS_NO_PATHCONV=1`. En PowerShell no hace falta.
- Si una corrida de Cypress se interrumpe, quedan procesos colgados. Ciérralos antes de volver a correr: `Get-Process Cypress | Stop-Process -Force` en PowerShell.

## 3. Criterios completos

### Criterio 5 — Caja blanca y caja negra

- **Qué se hizo:**
  - **Caja negra:** 23 escenarios y 69 casos (particiones de equivalencia, valores límite y tablas de decisión), ejecutados por la interfaz y, en CUR-F4, por la API.
  - **Caja blanca:** por cada método, diagrama de flujo, grafo de control (Sí a la derecha, No a la izquierda), V(G) por tres métodos, caminos independientes y diagramas de secuencia por escenario.
- **Para qué sirve:** la caja negra comprueba el comportamiento sin mirar el código; la caja blanca demuestra qué caminos del código recorre cada prueba y cuáles no son alcanzables.
- **Dónde está:**
  - `docs/CUR/Casos y Escenarios EspoCRM.xlsx` (caja negra, más la hoja *Regresión CUR*);
  - `docs/CUR/CUR-F1/caja-blanca.md` a `docs/CUR/CUR-F5/caja-blanca.md`;
  - `docs/CUR/evidencias/` (capturas).
- **Cómo regenerar los diagramas de CUR-F2 a F5:**

```bash
python docs/CUR/herramientas/generar_cur_f2_f5.py
```

### Criterio 6 — TDD y pruebas unitarias

- **Qué se hizo:**
  - **78 pruebas PHPUnit** con dobles de prueba (mocks), aplicando AAA y FIRST.
  - **5 ciclos TDD** (rojo, verde, refactor):
    - DEF-CUR-04: tasa menor que 0.0001;
    - DEF-CUR-03: tasa no numérica;
    - DEF-CUR-01: moneda no configurada;
    - DEF-CUR-02: monto no numérico;
    - DEF-CUR-05: moneda sin tasa vigente.
- **Para qué sirve:** comprueba cada clase aislada y deja demostrado que cada corrección nació de una prueba que primero fallaba.
- **Dónde está:**
  - pruebas en `tests/unit/Espo/VyV/Currency/`: `ConvertTypeTest`, `CalculatorUtilTest`, `CalculatorUtilSinBcmathTest`, `CurrencyTypeTest`, `RateServiceTest` y `RateSyncTest`;
  - ciclos documentados en `docs/CUR/tdd/` y `docs/CUR/refactor/`.
- **Comandos:**

```bash
docker exec espocrm sh -c "cd /var/www/html && phpunit -c tests/unit/Espo/VyV/Currency/phpunit-cur.xml --testdox"
```

Con cobertura de líneas:

```bash
docker exec espocrm sh -c "cd /var/www/html && XDEBUG_MODE=coverage phpunit -c tests/unit/Espo/VyV/Currency/phpunit-cur.xml --coverage-text"
```

Las ramas de `CalculatorUtil` sin bcmath (PHP sin `php.ini` no carga la extensión):

```bash
docker exec espocrm sh -c "cd /var/www/html && php -n /usr/local/bin/phpunit tests/unit/Espo/VyV/Currency/CalculatorUtilSinBcmathTest.php --no-coverage"
```

- **Resultado:** 78 pasan (las 7 sin bcmath se omiten en la corrida normal y pasan con `php -n`). `ConvertType`, `RateService`, `SyncManager`, `CurrencyType` y los hooks quedan al 100 % de líneas.

### Criterio 7 — Cypress y pruebas de API

- **Qué se hizo:** 46 pruebas, 8 de interfaz y 38 de API, con escenarios exitosos, alternativos y de error, cada una ligada a su caso CN-CUR del Excel.
- **Para qué sirve:** comprueba las funcionalidades de punta a punta contra la aplicación real.
- **Dónde está:**
  - specs en `cypress/e2e/cur/CUR-F1_conversion.cy.js` a `CUR-F5_sincronizacion.cy.js`;
  - comandos propios en `cypress/support/cur.js`;
  - documentación en `docs/CUR/cypress/README.md`.
- **Comando:**

```bash
npx cypress run --spec "cypress/e2e/cur/*.cy.js" --config trashAssetsBeforeRuns=false
```

Para abrir la interfaz gráfica de Cypress y verlas correr:

```bash
npx cypress open
```

### Criterio 8 — Gherkin, BDD y Screenplay

- **Qué se hizo:** 5 características en español (Dado, Cuando, Entonces) con 37 escenarios ejecutables. Los pasos usan el patrón Screenplay: el actor Alejandro tiene habilidades (BrowseTheWeb, CallAnApi), ejecuta tareas y responde preguntas.
- **Para qué sirve:** describe el comportamiento en lenguaje de negocio, y ese mismo texto se ejecuta como prueba.
- **Dónde está:**
  - features en `tests_bdd_screenplay/features/alejandro/`;
  - pasos en `tests_bdd_screenplay/step_definitions/alejandro/`;
  - tareas y preguntas en `tests_bdd_screenplay/screenplay/tasks/TasksAlejandro.js` y `questions/QuestionsAlejandro.js`;
  - documentación en `docs/CUR/bdd/README.md`.
- **Comando:**

```bash
npx cypress run --spec "tests_bdd_screenplay/features/alejandro/*.feature" --config trashAssetsBeforeRuns=false
```

### Criterio 10 — Regresión

- **Qué se hizo:** una suite de 20 casos elegidos según el riesgo del cambio: validación de tasas, conversión, flujos vecinos y errores de la fórmula. Se ejecutó contra la versión anterior (10 de 20) y contra la versión corregida (20 de 20).
- **Para qué sirve:** demuestra que las correcciones arreglan lo que debían sin romper lo que ya funcionaba.
- **Dónde está:**
  - suite en `cypress/e2e/cur/regression/R-CUR_monedas_tasas.regression.cy.js`;
  - documentación en `docs/CUR/regresion/README.md`;
  - hoja *Regresión CUR* del Excel.
- **Comando:**

```bash
npx cypress run --spec "cypress/e2e/cur/regression/R-CUR_monedas_tasas.regression.cy.js" --config trashAssetsBeforeRuns=false
```

### Criterio 11 — Accesibilidad (WCAG 2.1 AA)

- **Qué se hizo:**
  - auditoría automática con axe-core en las 6 pantallas de CUR;
  - comprobaciones manuales codificadas de teclado, foco, etiquetas, idioma, contraste, mensajes de error, reflujo a 320 px y zoom;
  - 19 pruebas en total y 8 barreras documentadas.
- **Para qué sirve:** detecta qué impide usar el módulo a personas con discapacidad, con el criterio WCAG y una recomendación para cada barrera. Además falla si aparece una barrera nueva.
- **Dónde está:** suite en `cypress/e2e/cur/a11y/CUR_accesibilidad.cy.js`; informes en `docs/CUR/accesibilidad/` (`README.md` y `axe/*.json`).
- **Comando:**

```bash
npx cypress run --spec "cypress/e2e/cur/a11y/CUR_accesibilidad.cy.js" --config trashAssetsBeforeRuns=false
```

### Criterio 12 — Usabilidad: evaluación heurística (parcial)

- **Qué se hizo:** evaluación con la plantilla Granollers v2021 (15 principios y 60 preguntas, cada una con su evidencia). Resultado: 56,8 % de usabilidad, con 9 problemas priorizados.
- **Dónde está:** `docs/CUR/usabilidad/Evaluacion-Heuristica-CUR.xlsx` y `docs/CUR/usabilidad/README.md`.
- **Falta:** las pruebas con usuarios reales y el cuestionario SUS.

### Criterio 13 — Seguridad (OWASP Top 10)

- **Qué se hizo:**
  - **análisis dinámico (DAST):** 20 pruebas de control de acceso, inyección, diseño, configuración y transporte;
  - **revisión de dependencias:** `composer audit` y `npm audit`;
  - **revisión manual del código** y de las cabeceras HTTP;
  - 8 hallazgos con severidad CVSS y su recomendación.
- **Para qué sirve:** comprueba que el módulo no expone datos ni acepta entradas maliciosas, y deja priorizado lo que hay que corregir.
- **Dónde está:** suite en `cypress/e2e/cur/security/CUR_seguridad.cy.js`; informe y evidencias en `docs/CUR/seguridad/`.
- **Comandos:**

```bash
npx cypress run --spec "cypress/e2e/cur/security/CUR_seguridad.cy.js" --config trashAssetsBeforeRuns=false
```

```bash
npm audit --omit=dev
```

### Criterio 14 — Inteligencia artificial aplicada a testing

- **Qué se hizo:**
  - **Stagehand:** 4 escenarios E2E guiados por IA (Gemini), 4 de 4.
  - **DeepEval:** evaluación de un componente de IA incorporado, `AsistenteMonedas` (Gemini con las tasas del CRM), con 4 métricas; 5 de 7.
  - **Playwright MCP:** un agente que recorre CUR sobre el árbol de accesibilidad, 5 de 5.
  - El oráculo de las tres es siempre la API o la fórmula de EspoCRM.
- **Dónde está:**
  - `tests_stagehand/alejandro/`, `tests_deepeval_alejandro/` y `tests_playwright_mcp_alejandro/`;
  - informe en `docs/CUR/ia/README.md`.
- **Requisito:** `tests_stagehand/.env` (ignorado por git) con `GEMINI_API_KEY`, `ESPOCRM_URL`, `ESPOCRM_USER` y `ESPOCRM_PASS`, la contraseña real del usuario de prueba. Usa `GEMINI_MODEL=google/gemini-3.1-flash-lite`; `gemini-3.8-flash` se satura y su cuota gratuita es de 20 solicitudes por día.
- **Comandos:**

```bash
node tests_playwright_mcp_alejandro/cur_playwright_mcp.mjs
```

```bash
tests_deepeval_alejandro/.venv/Scripts/python.exe tests_deepeval_alejandro/test_deepeval_cur.py
```

Stagehand se ejecuta desde la carpeta `tests_stagehand`:

```bash
npx tsx alejandro/run_stagehand_alejandro.ts
```

Si no existe el entorno de DeepEval:

```bash
python -m venv tests_deepeval_alejandro/.venv
```

```bash
tests_deepeval_alejandro/.venv/Scripts/python.exe -m pip install deepeval google-genai python-dotenv requests
```

### Criterio 15 — Refactorización y despliegue final

- **Qué se hizo:**
  - se corrigieron los 5 defectos del módulo (DEF-CUR-01 a 05);
  - se comparó la versión anterior con la final (10 de 20 frente a 20 de 20 en la regresión);
  - se desplegó con contenedores recreados y caché limpia;
  - después del despliegue pasan todas las suites.
- **Dónde está:** `docs/CUR/refactor/README.md`, con las salidas de cada fase en `docs/CUR/refactor/antes`, `despues` y `salidas`.
- **Comandos del despliegue:**

```bash
docker compose up -d --force-recreate espocrm espocrm-daemon
```

```bash
docker exec espocrm sh -c "cd /var/www/html && php clear_cache.php"
```

### Criterio 9 — Pipeline Jenkins, Docker y SonarQube (configurado, sin ejecutar)

- **Qué se hizo:**
  - SonarQube ahora analiza el código de CUR;
  - el `Jenkinsfile` tiene una etapa para las pruebas sin bcmath, toma la red del contenedor y **falla si el Quality Gate no está en OK**;
  - `run_sonar.ps1` incluye las pruebas de CUR.
- **Dónde está:** `Jenkinsfile`, `sonar-project.properties`, `run_sonar.ps1` y `docs/CUR/pipeline/README.md`.
- **Falta:** un Jenkins configurado y un token de SonarQube en `.sonar_token`. Con eso, el análisis manual se ejecuta así:

```bash
powershell -ExecutionPolicy Bypass -File run_sonar.ps1
```

## 4. Todas las suites de CUR seguidas

```bash
docker exec espocrm sh -c "cd /var/www/html && phpunit -c tests/unit/Espo/VyV/Currency/phpunit-cur.xml"
```

```bash
npx cypress run --spec "cypress/e2e/cur/**/*.cy.js,tests_bdd_screenplay/features/alejandro/*.feature" --config trashAssetsBeforeRuns=false
```

| Suite | Pruebas | Resultado (16-11-2026, después del despliegue) |
| :--- | :---: | :---: |
| Unitarias (PHPUnit) | 78 (+7 sin bcmath) | ✔ todas |
| Cypress interfaz y API | 46 | ✔ 46 |
| Regresión | 20 | ✔ 20 |
| BDD y Screenplay | 37 | ✔ 37 |
| Accesibilidad | 19 | ✔ 19 |
| Seguridad (DAST) | 20 | ✔ 20 |
| Stagehand / Playwright MCP / DeepEval | 4 / 5 / 7 | 4 / 5 / 5 |
