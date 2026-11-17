# Plan de pruebas — módulo CUR (Moneda y tasas de cambio)

**Criterio de la rúbrica:** 2. **Formato:** IEEE 829-2008 (Test Plan).
**Integrante responsable:** Alejandro Bustamante. **Versión:** 1.0.

**Historial:** el alcance y la estrategia se definieron el 15 de noviembre de 2026 en [`docs/CUR-alcance.md`](../CUR-alcance.md), al reemplazar el módulo de seguridad (SEC) por el de monedas. Este documento formaliza ese plan con la estructura IEEE 829. Las diferencias con lo ejecutado se explican en [`ejecucion-plan-CUR.md`](ejecucion-plan-CUR.md).

## 1. Identificador

`PP-VYV-CUR-2026-2-v1.0` — Plan de pruebas del módulo de monedas y tasas de cambio de EspoCRM, proyecto final de Validación y Verificación de Software 2026-2.

## 2. Introducción y referencias

**Objetivo general.** Verificar que el módulo de monedas de EspoCRM convierta, calcule, valide, consulte y sincronice montos y tasas de forma correcta, segura, accesible y usable. Además, corregir con TDD los defectos que se encuentren.

**Objetivos específicos:**
1. Diseñar y ejecutar pruebas de caja negra (particiones, valores límite, tablas de decisión) para las cinco funcionalidades.
2. Analizar los caminos del código con caja blanca (grafos, V(G), caminos independientes).
3. Automatizar pruebas unitarias, de interfaz, de API, BDD y de regresión.
4. Evaluar accesibilidad (WCAG 2.1 AA), usabilidad (heurística), seguridad (OWASP Top 10) y el uso de IA en las pruebas.
5. Corregir con TDD los defectos confirmados y comparar la versión anterior con la final.

**Referencias:**
- IEEE 829-2008 *Standard for Software and System Test Documentation*.
- ISO/IEC/IEEE 29119-3 *Test documentation*.
- W3C WCAG 2.1; OWASP Top 10 2021; heurísticas de Nielsen y de Granollers.
- Rúbrica del trabajo final de Validación y Verificación 2026-2.
- [`docs/CUR-alcance.md`](../CUR-alcance.md).

## 3. Elementos de prueba

| Elemento | Versión | Ubicación |
| :--- | :--- | :--- |
| EspoCRM | 10.1.1 (imagen `espocrm/espocrm`, código del módulo idéntico al del repositorio, comparado por MD5) | `application/Espo/` |
| Función de fórmula `ext\currency\convert` | 10.1.1 | `Core/Formula/Functions/ExtGroup/CurrencyGroup/ConvertType.php` |
| Conversor y aritmética | 10.1.1 | `Core/Currency/Converter.php`, `CalculatorUtil.php` |
| Validador de campos de moneda | 10.1.1 | `Classes/FieldValidators/CurrencyType.php`, `client/src/views/fields/currency.ts` |
| Servicio y API de tasas | 10.1.1 | `Tools/Currency/RateService.php`, `Api/*` |
| Sincronización de tasas | 10.1.1 | `Tools/Currency/SyncManager.php`, `RateEntryProvider.php`, `RecordHooks/CurrencyRecordRate/*` |

## 4. Características a probar

| ID | Característica | Riesgo | Prioridad |
| :--- | :--- | :--- | :--- |
| CUR-F1 | Conversión de montos entre monedas | Alto: un error da montos equivocados en reportes y cotizaciones | Alta |
| CUR-F2 | Aritmética decimal exacta | Alto: errores de redondeo acumulados | Alta |
| CUR-F3 | Validación de campos de moneda | Medio: datos inválidos en presupuestos | Alta |
| CUR-F4 | Consulta y actualización de tasas con permisos | Alto: una tasa inválida o un acceso indebido afecta a todo el CRM | Alta |
| CUR-F5 | Sincronización de la tasa vigente | Alto: la configuración puede quedar con una tasa equivocada sin que nadie lo note | Alta |

## 5. Características que no se prueban

- Inicio de sesión, CRUD de usuarios y CRUD de entidades: la rúbrica no los cuenta como funcionalidad. `Campaign` y `CurrencyRecordRate` se usan solo como vehículo de prueba.
- La sincronización automática con un proveedor externo de tasas: no hay servicio externo y las pruebas deben ser deterministas.
- Monedas distintas de USD (base) y COP: es la configuración acordada del entorno.
- Rendimiento y carga del módulo: el riesgo es bajo, porque las operaciones responden en menos de un segundo.

## 6. Enfoque y estrategia

| Nivel o tipo | Técnica | Herramienta | Funcionalidades |
| :--- | :--- | :--- | :--- |
| Caja negra (sistema) | Particiones de equivalencia, valores límite, tablas de decisión, transición de estados | Interfaz web y API; registro en Excel | F1 a F5 (F4 solo por API) |
| Caja blanca | Grafo de control, V(G) por tres métodos, caminos independientes, diagramas de secuencia | Lectura de código; Mermaid y SVG | F1 a F5 |
| Unitarias y TDD | AAA, FIRST, dobles de prueba (mocks y stubs), rojo → verde → refactor | PHPUnit 11, Xdebug | F1 a F5 |
| Interfaz y API | E2E y API REST | Cypress | F1 a F5 |
| BDD | Gherkin en español y patrón Screenplay | Cucumber para Cypress | F1 a F5 |
| Regresión | Selección por riesgo del cambio; versión anterior frente a final | Cypress y PHPUnit | Clases modificadas y vecinas |
| Accesibilidad | WCAG 2.1 AA: automática y comprobaciones manuales codificadas | axe-core, cypress-axe | Pantallas de F1, F3 y F5 |
| Usabilidad | Evaluación heurística; pruebas con usuarios y SUS | Plantilla Granollers v2021 | Pantallas de F1, F3 y F5 |
| Seguridad | OWASP Top 10: DAST, revisión de código, SCA | Cypress, `composer audit`, `npm audit` | F1, F3, F4 y F5 |
| IA aplicada | E2E guiadas por IA, evaluación de un componente de IA, agente MCP | Stagehand, DeepEval, Playwright MCP | F1 a F5 |
| Integración continua | Pipeline con pruebas, cobertura y Quality Gate | Jenkins, Docker, SonarQube | Todo el módulo |

**Datos de prueba:** moneda base USD y COP = 0.00025 USD; las suites restablecen la tasa antes de cada prueba. Los usuarios sin permisos se crean y se borran en cada ejecución. Las campañas y tasas de prueba se eliminan al terminar.

## 7. Criterios de aceptación (pasa / falla)

- **Un caso pasa** si el resultado obtenido coincide con el esperado. Para conversiones, el esperado lo calcula el propio EspoCRM (`ext\currency\convert`) o se deriva de la tasa configurada.
- **Una funcionalidad se acepta** si:
  - no tiene defectos de severidad alta abiertos;
  - todas sus pruebas automatizadas pasan;
  - sus clases tienen al menos 80 % de cobertura de líneas en las pruebas unitarias.
- **Criterio de salida del plan:**
  - todos los casos diseñados están ejecutados;
  - los defectos confirmados están corregidos con TDD o documentados con su justificación;
  - la regresión pasa completa sobre la versión final desplegada.

## 8. Criterios de suspensión y reanudación

- **Se suspende** si el entorno Docker no responde (la aplicación no da HTTP 200), si el código de la imagen deja de coincidir con el del repositorio, o si un defecto bloquea un flujo completo.
- **Se reanuda** cuando el entorno vuelve a responder y se comprueba que el código coincide (MD5) o que está montado desde el repositorio.

## 9. Entregables

| Entregable | Ubicación |
| :--- | :--- |
| Alcance | `docs/CUR-alcance.md` |
| Plan de pruebas | `docs/CUR/plan-pruebas-CUR.md` |
| Escenarios y casos de caja negra | `docs/CUR/Casos y Escenarios EspoCRM.xlsx` |
| Caja blanca | `docs/CUR/CUR-F1..F5/caja-blanca.md` |
| Pruebas automatizadas | `tests/unit/Espo/VyV/Currency/`, `cypress/e2e/cur/`, `tests_bdd_screenplay/*/alejandro/`, `tests_stagehand/alejandro/`, `tests_deepeval_alejandro/`, `tests_playwright_mcp_alejandro/` |
| Informes por criterio | `docs/CUR/{tdd,cypress,bdd,regresion,accesibilidad,usabilidad,seguridad,ia,refactor,pipeline}/README.md` |
| Matriz de trazabilidad | `docs/CUR/matriz-trazabilidad-CUR.md` |
| Informe de ejecución | `docs/CUR/ejecucion-plan-CUR.md` |
| Guía de ejecución | `docs/CUR/README.md` |

## 10. Entorno y recursos

| Recurso | Detalle |
| :--- | :--- |
| Aplicación | EspoCRM 10.1.1 en Docker (`espocrm`, `espocrm-daemon`, `espocrm-mysql` con MariaDB 10.11), `http://localhost:8080` |
| Lenguajes | PHP 8.4.27 (bcmath, Xdebug 3.5), Node 24, Python 3.13 |
| Herramientas | PHPUnit 11.5, Cypress 15.21 con Cucumber, axe-core, Stagehand 4.4, DeepEval 4.3.4, Playwright MCP 0.0.84, SonarQube 10.7, Jenkins |
| IA | Google Gemini (capa gratuita: 15 solicitudes por minuto) |
| Equipo | Windows 11, Docker Desktop |

## 11. Responsabilidades

| Integrante | Módulo | Responsabilidad |
| :--- | :--- | :--- |
| Alejandro Bustamante | CUR (monedas y tasas) | Diseño, ejecución, automatización, corrección con TDD y documentación de CUR-F1 a F5 |
| Tomás | Lead, Opportunity, Contact, Meeting, Lead Conversion | Su módulo; configuración inicial de Docker, Cypress y SonarQube |
| Andrés Bedoya | Cases, Quotes, Tasks, Accounts | Su módulo; Jenkinsfile y suite de regresión del equipo |

Las tres funcionalidades no se solapan: CUR no usa los módulos de los compañeros y ellos no usan las clases de CUR.

## 12. Cronograma

| Fecha | Actividad |
| :--- | :--- |
| 15-nov-2026 | Cambio de módulo (SEC → CUR), alcance, caja negra por interfaz y API, inicio de la caja blanca |
| 15-nov-2026 | Caja blanca F1 a F5, pruebas unitarias, TDD de DEF-CUR-03 y 04, Cypress |
| 16-nov-2026 | Regresión, BDD y Screenplay, accesibilidad, seguridad, IA aplicada, evaluación heurística |
| 16-nov-2026 | Refactorización final (DEF-CUR-01, 02 y 05), despliegue y pruebas posteriores, pipeline |
| Pendiente | Pruebas con usuarios y SUS; ejecución del pipeline en Jenkins; informe final en PDF |

## 13. Riesgos y contingencias

| Riesgo | Probabilidad | Impacto | Contingencia |
| :--- | :--- | :--- | :--- |
| El contenedor ejecuta el código de la imagen y no el del repositorio | Alta | Alto | Comparar por MD5 y montar las carpetas modificadas en `docker-compose.yml` |
| F4 no tiene pantalla | Cierta | Medio | Probarla por API (acordado) |
| Cuota y disponibilidad del modelo de IA | Media | Medio | Esperas entre llamadas, reintentos y cambio a `gemini-3.1-flash-lite` |
| Cambios del equipo en archivos compartidos (Cypress, Jenkins, hooks BDD) | Media | Medio | Archivos propios por integrante, frases y etiquetas `@CUR` exclusivas, merge revisado |
| Las pruebas de interfaz fallan por lentitud de carga | Media | Bajo | Esperas explícitas y un reintento solo en la suite de accesibilidad |
| No hay participantes reales para las pruebas de usabilidad | Media | Medio | Evaluación heurística primero; las sesiones con usuarios quedan pendientes |
