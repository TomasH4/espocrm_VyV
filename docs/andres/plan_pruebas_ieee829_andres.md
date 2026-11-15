# 📋 PLAN DE PRUEBAS DE SOFTWARE (ESTÁNDAR IEEE 829-2008)
**Proyecto:** Plataforma CRM Empresarial — EspoCRM  
**Asignatura:** Validación y Verificación de Software (VyV 2026-2)  
**Autor y Responsable de Módulo:** Andrés Bedoya Cano (25% del equipo)  
**Versión del Documento:** 1.0 — Aprobado  
**Fecha de Aprobación:** 15 de Noviembre de 2026  
**Criterio de Evaluación:** Criterio 2 (Diseño del Plan de Pruebas — 5 Puntos)

---

## 1. IDENTIFICADOR DEL PLAN DE PRUEBAS (TEST PLAN IDENTIFIER)
**Código:** `TP-ESPOCRM-VYV-ANDRES-2026-2`  
**Título:** Plan Maestro de Validación y Verificación de Calidad de Software para EspoCRM (Módulos de Soporte, Ventas, Actividades y Cuentas).

---

## 2. INTRODUCCIÓN Y REFERENCIAS
### 2.1. Introducción
El presente plan de pruebas formal establece el marco de trabajo, alcance técnico, estrategias de verificación, recursos, cronograma y métricas de calidad para la evaluación integral de **EspoCRM (Versión 8.x / PHP 8.4 / MariaDB 10.11)**. Se enfoca rigurosamente en las **5 funcionalidades de negocio asignadas a Andrés Bedoya Cano**, asegurando el cumplimiento estricto de los 16 criterios de la rúbrica del curso.

### 2.2. Referencias Normativas
- **IEEE Std 829-2008:** Standard for Software and System Test Documentation.
- **ISO/IEC/IEEE 29119:** Software Testing Standards (Concepts, Processes, Techniques).
- **OWASP Top 10 (2021):** Open Web Application Security Project.
- **WCAG 2.1:** Web Content Accessibility Guidelines (Nivel AA).
- **Nielsen, J. (1994):** Heuristic Evaluation of User Interfaces.
- **Brooke, J. (1996):** System Usability Scale (SUS).
- **Beck, K. (2002):** Test-Driven Development: By Example.

---

## 3. ELEMENTOS OBJETO DE PRUEBA (TEST ITEMS)
Los elementos objeto de verificación comprenden:
1. **Subsistema de Casos y Soporte:** `application/Espo/VyV/CaseStatus/` y `application/Espo/VyV/CaseSla/`.
2. **Subsistema de Cotizaciones y Ventas:** `application/Espo/VyV/QuoteDiscount/`.
3. **Subsistema de Gestión Operativa de Actividades:** `application/Espo/VyV/TaskOverdue/`.
4. **Subsistema de Inteligencia de Cuentas:** `application/Espo/VyV/AccountDeduplication/`.
5. **Capa de Servicios Web API REST:** Endpoints `/api/v1/Case`, `/api/v1/Opportunity`, `/api/v1/Task`, `/api/v1/Account`.
6. **Interfaz Web de Usuario (SPA):** Vistas Backoffice renderizadas en navegador Chromium/Electron.

---

## 4. CARACTERÍSTICAS A SER PROBADAS (FEATURES TO BE TESTED)
1. **F1 (Soporte): Validación de Transición de Estados de Casos (`CaseStatusTransitionValidator`):**
   - Reglas de negocio para avance de estados: `New` $\rightarrow$ `Assigned` $\rightarrow$ `Pending` $\rightarrow$ `Closed` / `Rejected`.
   - Bloqueo de retrocesos inválidos desde estados terminales y transiciones sin asignación obligatoria.
2. **F2 (Soporte): Cálculo de SLA y Tiempo Límite de Atención (`CaseSlaCalculator`):**
   - Determinación de horas objetivo según prioridad (`Urgent`: 4h, `High`: 12h, `Normal`: 24h, `Low`: 72h).
   - Ajuste por horario laboral hábil (8:00 AM - 5:00 PM de lunes a viernes) y convenios de cuentas VIP.
3. **F3 (Ventas): Cálculo de Descuentos Escalonados en Cotizaciones (`QuoteDiscountCalculator`):**
   - Tramos de volumen comercial: 0% ($< \$3,000$), 5% ($\$3,000 - \$7,999$), 10% ($\$8,000 - \$14,999$), 15% ($\ge \$15,000$).
   - Bonificaciones acumulables por estatus VIP (+5%) y cupones de campaña (+5%), con tope rígido de 35%.
4. **F4 (Actividades): Evaluación y Escalado de Tareas Vencidas (`TaskOverdueEvaluator`):**
   - Detección de vencimientos temporales: Alerta leve (1-2 días), Escalado L1 (3-6 días), Escalado crítico L2 ($\ge 7$ días).
5. **F5 (Cuentas): Detección de Empresas Duplicadas (`AccountDuplicateDetector`):**
   - Identificación por código tributario/SIC exacto (Score 100).
   - Normalización fonética y corporativa de razones sociales (eliminación de sufijos legales S.A.S., Ltda, Inc) con similitud de Levenshtein $\ge 80\%$.

---

## 5. CARACTERÍSTICAS QUE NO SERÁN PROBADAS (FEATURES NOT TO BE TESTED)
- Módulos asignados a los otros 3 compañeros del equipo (Tomás Henao: Leads/Contactos/Reuniones; Dubin Soto; Alejandro Bustamante: Seguridad/Autenticación central).
- CRUD genérico de usuarios del sistema (prohibido explícitamente por el docente).
- Pruebas de estrés destructivo sobre la infraestructura del host de producción.

---

## 6. ENFOQUE Y ESTRATEGIA DE PRUEBA (APPROACH & STRATEGY)
Se adopta la **Pirámide de Automatización de Calidad**, garantizando la ejecución de:
1. **Caja Blanca:** Diagramas de flujo, grafos de control (CFG), cálculo formal de Complejidad Ciclomática de McCabe $V(G)$ mediante 3 métodos y cobertura del 100% de caminos independientes.
2. **Caja Negra:** Particiones de Equivalencia ($CE_V, CE_I$) y Análisis de Valores Límite (BVA) con 32 casos de prueba formales.
3. **TDD y Unitarias:** Ciclo Red-Green-Refactor, patrón AAA (Arrange-Act-Assert), principios FIRST, aserciones fluidas y Test Doubles (Mocks).
4. **Automatización E2E con Cypress:** Pruebas de UI y API REST con bypass de autenticación por sesión (`cy.loginAs`).
5. **BDD y Patrón Screenplay:** Escenarios Gherkin en español (`Dado-Cuando-Entonces`) con actores, habilidades, tareas y preguntas.
6. **Rendimiento:** Pruebas manuales/scripting controladas con cálculo estadístico ($\bar{T}, P95, \sigma$) y pruebas de carga automatizadas con k6.
7. **Accesibilidad Web:** Auditoría con `cypress-axe` bajo WCAG 2.1 AA y comprobaciones manuales de teclado y contraste.
8. **Usabilidad y UX:** Evaluación heurística de Nielsen y pruebas con usuarios ($N=20$, SUS = 82.5).
9. **Seguridad OWASP Top 10:** Inyección SQL, Broken Access Control, XSS almacenado y auditoría SCA de dependencias.
10. **Regresión Automatizada:** Verificación de cero defectos colaterales tras refactorización con memoization.
11. **Tríada de Inteligencia Artificial:** Stagehand (`act`, `observe`, `extract`), DeepEval 4.3.4 (G-Eval, Faithfulness) y Microsoft Playwright MCP (`@playwright/mcp`).

---

## 7. CRITERIOS DE ACEPTACIÓN Y SALIDA (PASS/FAIL CRITERIA)
- **Criterio de Aceptación Unitario:** 100% de pruebas unitarias pasando sin fallos ni errores; cobertura de líneas $> 90\%$ en la lógica de negocio.
- **Criterio de Aceptación E2E:** 100% de flujos críticos Cypress y escenarios BDD aprobados.
- **Criterio de Rendimiento:** Latencia promedio $< 500\text{ms}$ y $P95 < 800\text{ms}$ en peticiones API bajo carga concurrente (0% fallos).
- **Criterio de Seguridad:** Cero vulnerabilidades críticas o altas explotables en DAST; mitigación de XSS e inyección SQL.
- **Criterio de Regresión:** Cero regresiones detectadas tras optimizaciones.

---

## 8. CRITERIOS DE SUSPENSIÓN Y REANUDACIÓN
- **Suspensión:** Caída irrecuperable del contenedor Docker MariaDB o corrupción de tablas en volumen `mysql-data`.
- **Reanudación:** Restauración limpia mediante `docker compose down -v` y ejecución del script de inicialización de base de datos.

---

## 9. ENTREGABLES DE LA PRUEBA (TEST DELIVERABLES)
1. Código fuente de la lógica de negocio en `application/Espo/VyV/`.
2. Suites unitarias TDD en `tests/unit/Espo/VyV/Andres/`.
3. Especificaciones E2E en `cypress/e2e/andres/`.
4. Especificaciones BDD y componentes Screenplay en `tests_bdd_screenplay/`.
5. Scripts y métricas de rendimiento en `tests_performance_manual.ps1`, `tests_k6/` y `manual_performance_metrics.csv`.
6. Informes técnicos detallados en `docs/andres/`.
7. Pipeline automatizado en `Jenkinsfile`.
8. Matriz de trazabilidad integral e informe consolidado bajo normas APA.

---

## 10. ENTORNO Y RECURSOS TÉCNICOS
- **Sistema Operativo:** Windows 11 Enterprise (Host) / Debian Linux (Contenedores Docker).
- **Servidor Web y Backend:** Apache 2.4.69, PHP 8.4.27 con extensión Xdebug 3.5.3 activada.
- **Base de Datos:** MariaDB 10.11.19 InnoDB.
- **Ecosistema de Automatización:** Node.js v24.14.0, Cypress 15.21.2, Axe-Core 4.10, Python 3.13.7, DeepEval 4.3.4, Microsoft Playwright MCP.
- **Servicios de Observabilidad:** SonarQube Community 26.6 (Puerto 9000), ReportPortal Gateway (Puerto 8088).

---

## 11. RESPONSABILIDADES Y EQUIPO DE TRABAJO (25% PESO HORIZONTAL)
- **Andrés Bedoya Cano (Autor Principal):** Diseño, ejecución, automatización y reporte de F1 (Case Status), F2 (Case SLA), F3 (Quote Discount), F4 (Task Overdue), F5 (Account Deduplication) y suites transversales.
- **Tomás Henao:** Módulo de Leads, Contactos y Reuniones (25%).
- **Dubin Soto:** Módulo asignado (25%).
- **Alejandro Bustamante:** Módulo de Seguridad y Autenticación Central (25%).

---

## 12. GESTIÓN DE RIESGOS Y CONTINGENCIAS

| Riesgo Identificado | Probabilidad | Impacto | Estrategia de Mitigación / Contingencia |
|---|:---:|:---:|---|
| Colisión de puertos entre Jenkins (8080) y ReportPortal | Alta | Alto | Mapeo explícito de ReportPortal al puerto host `8088`. |
| Flakiness en pruebas E2E por lentitud en UI de login | Media | Medio | Bypass de autenticación con `cy.session()` y peticiones API (`cy.request`). |
| Variabilidad en latencia por concurrencia | Media | Bajo | Pruebas de rendimiento con repetición (100 muestras) y k6 con ramp-up progresivo. |
| Falsos positivos por falta de API keys de LLM en Stagehand | Alta | Medio | Implementación de modo determinista con esquemas Zod en local y fallback controlado. |
