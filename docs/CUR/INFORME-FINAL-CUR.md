# Validación y verificación del módulo de monedas y tasas de cambio de EspoCRM

**Alejandro Bustamante**
Validación y Verificación de Software, 2026-2
16 de noviembre de 2026

Repositorio: https://github.com/TomasH4/espocrm_VyV (rama `dev`)

## Resumen

Este informe presenta la validación y verificación del módulo de monedas y tasas de cambio (CUR) de EspoCRM 10.1.1, un CRM de código abierto, desplegado en Docker. Se probaron cinco funcionalidades: conversión de montos, aritmética decimal, validación de campos de moneda, consulta y actualización de tasas, y sincronización de la tasa vigente. Se aplicaron pruebas de caja negra (69 casos) y de caja blanca (20 grafos), 78 pruebas unitarias con dobles de prueba, 46 pruebas de interfaz y API con Cypress, 37 escenarios BDD con Gherkin y Screenplay, una suite de regresión, pruebas de accesibilidad WCAG 2.1 AA, una evaluación heurística de usabilidad, pruebas de seguridad según OWASP Top 10, y tres herramientas de IA aplicadas a las pruebas (Stagehand, DeepEval y Playwright MCP). Se encontraron cinco defectos —entre ellos cuatro errores HTTP 500 y una tasa que quedaba en 1 sin aviso— y los cinco se corrigieron con TDD. Después del despliegue final, 234 de 236 pruebas automatizadas pasan (99,2 %) y la suite de regresión pasó de 10 de 20 casos en la versión original a 20 de 20 en la versión final.

*Palabras clave:* pruebas de software, TDD, Cypress, BDD, accesibilidad, OWASP, EspoCRM.

## 1. Presentación del proyecto y alcance (criterio 1)

EspoCRM es una aplicación web de gestión de relaciones con clientes (CRM): backend en PHP 8 con su propio ORM, API REST, y frontend de una sola página en JavaScript y TypeScript (Backbone). La versión probada es la **10.1.1**, ejecutada con Docker Compose (EspoCRM, un demonio de tareas y MariaDB 10.11).

El módulo CUR maneja montos en varias monedas: convierte entre monedas, calcula con aritmética decimal exacta, valida los campos de moneda y mantiene las tasas de cambio. Las cinco funcionalidades, ninguna de las cuales es inicio de sesión ni CRUD de usuarios, son:

| ID | Funcionalidad | Código principal |
| :--- | :--- | :--- |
| CUR-F1 | Conversión de montos entre monedas | `ConvertType` (`ext\currency\convert`), `Converter` |
| CUR-F2 | Aritmética decimal exacta | `CalculatorUtil` |
| CUR-F3 | Validación de campos de moneda | `CurrencyType`, `currency.ts` |
| CUR-F4 | Consulta y actualización de tasas con permisos | `RateService`, API `/CurrencyRate` |
| CUR-F5 | Sincronización de la tasa vigente | `SyncManager`, hooks de `CurrencyRecordRate` |

El alcance detallado está en `docs/CUR-alcance.md`.

## 2. Plan de pruebas, trazabilidad y ejecución (criterios 2, 3 y 4)

- **Plan** (IEEE 829): objetivos, elementos, características dentro y fuera del alcance, estrategia por tipo de prueba, criterios de aceptación, suspensión y salida, entregables, entorno, responsables, cronograma y riesgos. Está en `docs/CUR/plan-pruebas-CUR.md`.
- **Matriz de trazabilidad:** une cada requisito con sus casos, archivos, resultados, defectos y evidencias. Está en `docs/CUR/matriz-trazabilidad-CUR.md`.
- **Ejecución:** documenta el entorno, el procedimiento, los resultados y métricas, y las diferencias entre lo planeado y lo ejecutado. Está en `docs/CUR/ejecucion-plan-CUR.md`. La principal diferencia fue el cambio de módulo (de seguridad a monedas) el 15 de noviembre, porque una de las funcionalidades anteriores actuaba sobre el inicio de sesión.

## 3. Caja negra y caja blanca (criterio 5)

**Caja negra.** Se diseñaron 23 escenarios y 69 casos con particiones de equivalencia, valores límite, tablas de decisión (perfil × acción) y transición de estados. Se ejecutaron por la interfaz y, en CUR-F4 (sin pantalla), por la API. Resultado: 54 correctos, 8 con observación y 7 fallidos, que corresponden a 5 defectos.

**Caja blanca.** Para 20 métodos se construyó el diagrama de flujo, el grafo de control (con la rama Sí a la derecha y la No a la izquierda), la complejidad ciclomática V(G) por tres métodos (E − N + 2, P + 1 y regiones; McCabe, 1976) y los caminos independientes. Cada camino se asoció al caso de caja negra que lo recorre. El análisis encontró código inalcanzable: la rama `result === null` de `CalculatorUtil::divide()` y las ramas sin bcmath, que solo se alcanzan con PHP sin `php.ini`.

## 4. TDD y pruebas unitarias (criterio 6)

Se escribieron 78 pruebas PHPUnit con el patrón AAA, los principios FIRST y dobles de prueba (mocks y stubs) para todas las dependencias, sin tocar la base de datos. Los cinco defectos se corrigieron con TDD (Beck, 2003):

| Ciclo | Defecto | Rojo | Verde |
| :--- | :--- | :--- | :--- |
| 1 | DEF-CUR-04: la API aceptaba tasas menores que 0.0001 | 3 fallos | `validateRate()` con el mínimo leído de la definición del campo |
| 2 | DEF-CUR-03: una tasa no numérica daba 500 (y `true` se guardaba como 1) | 4 fallos | Validación de que el valor sea numérico |
| 3 | DEF-CUR-01: una moneda no configurada daba 500 | 3 fallos | `checkCurrency()`: error de fórmula con la causa |
| 4 | DEF-CUR-02: un monto no numérico daba `AssertionError` 500 | 1 fallo | `checkAmount()` reemplaza el `assert()` |
| 5 | DEF-CUR-05: sin tasa vigente, la configuración pasaba a 1 | 1 fallo | Se conserva la última tasa conocida |

Cobertura de líneas: 100 % en `ConvertType`, `RateService`, `SyncManager`, `CurrencyType` y los hooks; 95,1 % en el total del módulo.

## 5. Cypress y pruebas de API (criterio 7)

Se automatizaron 46 pruebas (8 de interfaz y 38 de API), con escenarios exitosos, alternativos y de error, cada una ligada a su caso de caja negra. Los comandos propios del módulo están en `cypress/support/cur.js`. Cada prueba deja el entorno como estaba: restablece la tasa, crea y borra los usuarios sin permisos y elimina los registros de prueba. Resultado después del despliegue: 46 de 46.

## 6. BDD con Gherkin y Screenplay (criterio 8)

Cinco características en español (Dado, Cuando, Entonces) con Antecedentes y Esquemas con Ejemplos dan 37 escenarios ejecutables con Cucumber para Cypress. Los pasos siguen el patrón Screenplay: el actor tiene habilidades (navegar y llamar a la API), ejecuta tareas y responde preguntas. Resultado: 37 de 37 en dos corridas completas.

## 7. Regresión (criterio 10)

Una suite de 20 casos, elegidos según el riesgo del cambio, se ejecutó contra la versión original y contra la corregida:

| Versión | Resultado |
| :--- | :--- |
| Original (EspoCRM 10.1.1) | 10 de 20: fallan exactamente los casos de los defectos |
| Final (corregida y desplegada) | **20 de 20** |

Los 10 casos de contrato, conversión, permisos y sincronización pasaron en las dos versiones: las correcciones no rompieron nada vecino.

## 8. Accesibilidad (criterio 11)

Se combinó la auditoría automática con axe-core en las seis pantallas del módulo con comprobaciones manuales codificadas de teclado, foco, etiquetas, idioma, contraste, mensajes y adaptación visual (W3C, 2018). Resultado: 19 de 19.

- **Cumple:** se opera solo con teclado, no hay trampas de foco, el foco es visible y la pantalla se adapta a 320 px.
- **Barreras documentadas (8):** campos sin etiqueta asociada (nivel A), contraste de etiquetas de 2.95:1 (el mínimo es 4.5:1), página sin idioma declarado, zoom bloqueado en móviles y errores que no se anuncian a los lectores de pantalla.

## 9. Usabilidad (criterio 12)

La evaluación heurística, con la plantilla de Granollers (2018) que integra los principios de Nielsen (1994) y Tognazzini, cubrió 15 principios y 60 preguntas, cada una con su evidencia. Resultado: **56,8 %** de usabilidad. Los principios más débiles son ayuda y documentación (26 %), prevención de errores (33 %) y protección del trabajo (33 %). Se priorizaron 9 problemas con su recomendación. Las pruebas con usuarios y el cuestionario SUS (Brooke, 1996) están pendientes.

## 10. Seguridad (criterio 13)

Según OWASP Top 10 (OWASP Foundation, 2021):

- **DAST:** 20 pruebas, 20 de 20. Cubren control de acceso (401 y 403 correctos en los cuatro endpoints, sin enumeración de usuarios), inyección SQL y XSS rechazadas, y diseño y configuración.
- **Revisión de dependencias:** 5 paquetes PHP con avisos; 0 avisos en las dependencias npm de producción.
- **Revisión manual de código:** consultas parametrizadas, control de acceso por ámbito y nivel, y `zend.assertions = 1` en el contenedor.
- **Hallazgos:** 8, con severidad CVSS. Dos se corrigieron en la refactorización y uno quedó parcialmente corregido.

## 11. IA aplicada a las pruebas (criterio 14)

| Herramienta | Uso | Resultado |
| :--- | :--- | :--- |
| Stagehand | Pruebas E2E en lenguaje natural (`observe`, `act`, `extract`) verificadas contra la API | 4 de 4 |
| DeepEval | Evaluación de un componente de IA incorporado, `AsistenteMonedas` (Gemini con las tasas del CRM, patrón RAG), con GEval, Faithfulness, Answer Relevancy y Hallucination. El resultado esperado lo calcula EspoCRM | 5 de 7; Exactitud 1.00 en los 7 |
| Playwright MCP | Un agente recorre CUR sobre el árbol de accesibilidad | 5 de 5 |

**Hallazgos sobre las herramientas de IA:**
- Que un agente «llene» un campo con máscara no equivale a que una persona lo teclee: la aplicación no registra el valor.
- Un LLM usado como juez puede caer en la misma manipulación que se quiere evaluar (DE-CUR-07).
- Por eso el oráculo de las tres herramientas fue siempre EspoCRM y no la IA.

## 12. Pipeline con Jenkins, Docker y SonarQube (criterio 9)

Se incluyó el módulo en el análisis de SonarQube. Al `Jenkinsfile` se le agregó una etapa para las pruebas sin bcmath, se corrigió el nombre de la red de Docker y se hizo que el pipeline **falle si el Quality Gate no está en OK**. La ejecución completa en Jenkins queda pendiente de un servidor configurado y de un token de SonarQube.

## 13. Refactorización y despliegue final (criterio 15)

Los cambios derivados de las pruebas están en el backend (`RateService`, `ConvertType` y `SyncManager`); el frontend no necesitó cambios. El despliegue final recreó los contenedores con el código corregido y limpió la caché. Después del despliegue pasaron todas las suites:

| Suite | Resultado |
| :--- | :--- |
| Unitarias | 78 de 78 |
| Cypress | 46 de 46 |
| BDD | 37 de 37 |
| Regresión | 20 de 20 |
| Accesibilidad | 19 de 19 |
| Seguridad | 20 de 20 |

## 14. Conclusiones

1. **Los defectos estaban donde las entradas cruzan una frontera:** la API (`/CurrencyRate`) y la función de fórmula aplicaban reglas más débiles que el formulario. Probar solo la interfaz no los habría encontrado.
2. **Sí había caminos de error que terminaban en HTTP 500:** el análisis de caja blanca anticipó cuáles eran, y TDD permitió corregirlos con una prueba que primero fallaba.
3. **Ejecutar la regresión contra la versión anterior y contra la final es la forma más clara de demostrar una corrección:** fallan exactamente los casos del defecto y el resto se mantiene.
4. **La IA ayuda a escribir pruebas legibles e independientes de los selectores**, pero declara éxitos que no ocurrieron. Necesita siempre un oráculo determinista.
5. **Las barreras de accesibilidad y de usabilidad más importantes vienen de las plantillas comunes de EspoCRM.** Corregirlas mejoraría todo el CRM, no solo este módulo.

## 15. Instalación y ejecución

La guía completa con todos los comandos está en `docs/CUR/README.md`. Resumen:

```bash
docker compose up -d mysql espocrm espocrm-daemon
npm ci --ignore-scripts && npx cypress install
docker exec espocrm sh -c "cd /var/www/html && phpunit -c tests/unit/Espo/VyV/Currency/phpunit-cur.xml"
npx cypress run --spec "cypress/e2e/cur/**/*.cy.js,tests_bdd_screenplay/features/alejandro/*.feature" --config trashAssetsBeforeRuns=false
```

## Referencias

Beck, K. (2003). *Test-driven development: By example*. Addison-Wesley.

Brooke, J. (1996). SUS: A "quick and dirty" usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester y I. L. McClelland (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis.

Granollers, T. (2018). Usability evaluation with heuristics, beyond Nielsen's list. En *ACHI 2018: The Eleventh International Conference on Advances in Computer-Human Interactions* (pp. 60–65). IARIA.

IEEE. (2008). *IEEE standard for software and system test documentation* (IEEE Std 829-2008). https://doi.org/10.1109/IEEESTD.2008.4578383

McCabe, T. J. (1976). A complexity measure. *IEEE Transactions on Software Engineering, SE-2*(4), 308–320. https://doi.org/10.1109/TSE.1976.233837

Nielsen, J. (1994). Enhancing the explanatory power of usability heuristics. En *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems* (pp. 152–158). ACM. https://doi.org/10.1145/191666.191729

OWASP Foundation. (2021). *OWASP Top 10: 2021*. https://owasp.org/Top10/

W3C. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/
