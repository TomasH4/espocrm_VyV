# Ejecución del plan de pruebas — módulo CUR (Moneda y tasas de cambio)

**Criterio de la rúbrica:** 4. **Integrante:** Alejandro Bustamante. **Periodo:** 15 y 16 de noviembre de 2026.
**Plan de referencia:** [`plan-pruebas-CUR.md`](plan-pruebas-CUR.md). **Trazabilidad:** [`matriz-trazabilidad-CUR.md`](matriz-trazabilidad-CUR.md).

## 1. Entorno de ejecución

| Elemento | Valor |
| :--- | :--- |
| Aplicación | EspoCRM 10.1.1 en Docker Desktop (Windows 11): `espocrm`, `espocrm-daemon`, `espocrm-mysql` (MariaDB 10.11) |
| Código ejecutado | Imagen `espocrm-dev` (Dockerfile del proyecto) con `application/Espo/Tools/Currency` y `application/Espo/Core/Formula/Functions/ExtGroup/CurrencyGroup` montados desde el repositorio |
| Runtime | PHP 8.4.27 (bcmath, Xdebug 3.5.3), Node 24.14, Python 3.13 |
| Herramientas | PHPUnit 11.5.58, Cypress 15.21.2 (Electron 138), cypress-axe/axe-core 4.x, Stagehand 4.4.0, DeepEval 4.3.4, Playwright MCP 0.0.84 |
| Datos | Moneda base USD; COP = 0.00025 USD. Usuarios sin permisos, campañas y tasas de prueba creados y borrados por las propias pruebas |

## 2. Procedimiento

1. **Caja negra:** se ejecutó a mano por la interfaz (Formula Sandbox, formulario de Campaign y Currencies › COP) y por la API (CUR-F4). Cada resultado quedó en el Excel con su evidencia.
2. **Caja blanca:** lectura del código, grafos, V(G) y caminos. Cada camino se asignó al caso de caja negra que lo recorre.
3. **Automatización:** pruebas unitarias en el contenedor (PHPUnit) y Cypress, BDD, accesibilidad y seguridad contra la aplicación en ejecución.
4. **TDD:** por cada defecto confirmado, prueba en rojo, corrección mínima (verde) y refactorización, con la salida de cada fase guardada.
5. **Despliegue final:** contenedores recreados, caché limpia y todas las suites ejecutadas de nuevo. La regresión se ejecutó también contra la versión anterior.

## 3. Resultados

| Tipo de prueba | Diseñadas | Ejecutadas | Pasan | Fallan | Evidencia |
| :--- | :---: | :---: | :---: | :---: | :--- |
| Caja negra (manual) | 69 | 69 | 54 (+8 con observación) | 7 → 5 defectos, todos corregidos | `docs/CUR/Casos y Escenarios EspoCRM.xlsx` |
| Caja blanca: caminos factibles cubiertos | 20 grafos | 20 | Ver la cobertura de cada `caja-blanca.md` | — | `docs/CUR/CUR-F1..F5/` |
| Unitarias (PHPUnit) | 78 (7 de ellas solo corren sin bcmath) | 78 (71 normales + 7 con `php -n`) | 78 | 0 | `docs/CUR/refactor/despues/unitarias*.txt` |
| Cypress (interfaz y API) | 46 | 46 | 46 | 0 | `docs/CUR/refactor/despues/cypress-cur.txt` |
| BDD (Gherkin y Screenplay) | 37 | 37 | 37 | 0 | `docs/CUR/refactor/despues/bdd.txt` |
| Regresión | 20 | 20 | 20 (10 en la versión anterior) | 0 | `docs/CUR/refactor/{antes,despues}/regresion.txt` |
| Accesibilidad | 19 | 19 | 19 | 0 (8 barreras documentadas) | `docs/CUR/refactor/despues/accesibilidad.txt` |
| Seguridad (DAST) | 20 | 20 | 20 | 0 (8 hallazgos documentados) | `docs/CUR/refactor/despues/seguridad.txt` |
| IA: Stagehand / Playwright MCP / DeepEval | 4 / 5 / 7 | 16 | 4 / 5 / 5 | DeepEval 2 | `docs/CUR/ia/` |
| Usabilidad heurística | 60 preguntas | 60 | 56,8 % de usabilidad | — | `docs/CUR/usabilidad/Evaluacion-Heuristica-CUR.xlsx` |

### Métricas

| Métrica | Valor |
| :--- | :--- |
| Casos de prueba ejecutados (manuales y automatizados) | 69 + 236 = **305** |
| Tasa de aprobación de las suites automatizadas, en la versión final | **234 / 236 = 99,2 %** (las 2 que no pasan son métricas de DeepEval) |
| Defectos encontrados / corregidos | **5 / 5** (DEF-CUR-01 a 05) + 1 observación resuelta (OBS-CUR-06) |
| Densidad de defectos | 5 defectos / 5 funcionalidades = 1 por funcionalidad |
| Defectos encontrados por técnica | Caja negra 5 (todos); el TDD encontró además el caso `true` guardado como 1 |
| Cobertura de líneas (PHPUnit y Xdebug) | `ConvertType`, `RateService`, `SyncManager`, `CurrencyType` y los hooks: **100 %**. `CalculatorUtil`: 64 % medido, porque las ramas sin bcmath se ejecutan con `php -n`, sin Xdebug. Total del módulo: **95,1 %** |
| Respuestas HTTP 500 provocables en el módulo | 4 → **0** |
| Barreras de accesibilidad | 8 (2 de severidad alta) |
| Hallazgos de seguridad | 8 (2 corregidos, 1 parcial) |

## 4. Lo planeado frente a lo ejecutado

| Planeado | Ejecutado | Diferencia y motivo |
| :--- | :--- | :--- |
| Módulo de seguridad (SEC-F1 a F5) | Módulo de monedas (CUR-F1 a F5) | El 15-nov se cambió de módulo: SEC-F3 actuaba sobre el inicio de sesión, que la rúbrica excluye. Las carpetas `docs/SEC-*` quedaron sin uso |
| Caja negra por interfaz en las 5 funcionalidades | F4 por API | F4 no tiene pantalla: la pantalla de Currency guarda por Settings, no por `/CurrencyRate`. Acordado con el integrante |
| Diagramas de caja blanca en SVG | SVG en F1; Mermaid en F2 a F5 | Por tiempo, F2 a F5 se generaron solo en Mermaid. Se verificaron dibujándolos (Sí a la derecha, No a la izquierda) |
| Casos de caja blanca de frontend (JavaScript) | No ejecutados (CB-CUR-F3-01/02, F5-02) | Requieren compilar el cliente para Jasmine. Se decidió cerrar el criterio 5 sin ellos |
| TDD sobre «mensajes sin comilla de cierre» en `Converter.php` (candidato del alcance) | No se corrigió | Se priorizaron los 5 defectos que causan errores 500 o datos incorrectos. Queda como defecto menor del núcleo |
| Un ciclo TDD | 5 ciclos | Se corrigieron todos los defectos confirmados |
| Seguridad con SonarQube | Revisión manual de código, DAST y SCA | Las credenciales de SonarQube del equipo no son válidas en la instancia local; se decidió seguir sin él |
| Stagehand con `gemini-3.8-flash` | Con `gemini-3.1-flash-lite`, 4 de 4 en la corrida 6 | El modelo del `.env` se saturó y agotó su cuota gratuita (20 solicitudes por día). Hubo que adaptar las pruebas a Stagehand 4.4 y teclear en los campos con máscara |
| DeepEval con evaluación en lote | Evaluación secuencial con reintentos | La capa gratuita permite 15 solicitudes por minuto |
| Pipeline ejecutado en Jenkins con Quality Gate | Configuración lista, sin ejecutar de punta a punta | No hay un Jenkins configurado para el proyecto ni un token de SonarQube en este equipo |
| Usabilidad: heurística, pruebas con usuarios y SUS | Solo la heurística | Las sesiones con usuarios reales están pendientes |
| Ejecución en el entorno tal como venía | Merge con el trabajo del equipo antes del despliegue | Tomás reorganizó las carpetas de pruebas: la regresión de CUR pasó a `cypress/e2e/cur/regression/` |

## 5. Incidencias del entorno

| Incidencia | Efecto | Solución |
| :--- | :--- | :--- |
| `init-db.sql` en UTF-16 | MariaDB no lo importaba | Conversión a UTF-8; luego el equipo subió su propia versión |
| El contenedor ejecuta el código de la imagen | Las correcciones no se veían en la aplicación | Montaje de las carpetas modificadas en `docker-compose.yml` |
| `npm ci` falla por `phantomjs` | Sin dependencias de Cypress | `npm ci --ignore-scripts` y `npx cypress install` |
| Corridas de Cypress interrumpidas | Procesos colgados que bloqueaban la siguiente | Cerrar los procesos de Cypress antes de volver a correr |
| Carpeta en OneDrive | Cypress no puede mandar las capturas viejas a la papelera | `--config trashAssetsBeforeRuns=false` |
| Docker Desktop cerrado durante la sesión | La aplicación dejó de responder | Reinicio de Docker y de los servicios de EspoCRM |
