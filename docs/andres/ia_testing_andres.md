# 🤖 INFORME DE INTELIGENCIA ARTIFICIAL APLICADA A TESTING (TRÍADA DE IA)
**Proyecto:** EspoCRM (VyV 2026-2)  
**Autor:** Andrés Bedoya Cano  
**Herramientas de IA:** Stagehand (`@browserbase/stagehand`), DeepEval 4.3.4, Microsoft Playwright MCP (`@playwright/mcp`)  
**Fecha de Ejecución:** 15 de Noviembre de 2026  
**Resultado Global:** **100% de Pruebas con IA Ejecutadas y Aprobadas en Entorno Real**

---

## 1. INTRODUCCIÓN Y ALINEACIÓN CON LA RÚBRICA (CRITERIO 14 — 10 PUNTOS)

El Criterio 14 exige la implementación de una tríada de herramientas de Inteligencia Artificial:
1. **Stagehand:** Automatización resiliente de flujos web basada en lenguaje natural con enrutamiento de LLM y extracción estructurada con esquemas Zod.
2. **DeepEval:** Evaluación cuantitativa de un componente inteligente incorporado al CRM mediante métricas formales de LLM (G-Eval, Answer Relevancy, Faithfulness / Hallucination-free).
3. **Herramienta Adicional Trabajada en Clase — Microsoft Playwright MCP (`@playwright/mcp`):** Servidor oficial de Model Context Protocol de Microsoft para inspección y automatización declarativa del navegador a través del árbol de accesibilidad (Accessibility Tree).

---

## 2. HERRAMIENTA 1: AUTOMATIZACIÓN RESILIENTE CON STAGEHAND

### 2.1. Arquitectura y Configuración
- **Archivo ejecutable:** [`tests_stagehand/andres/F1_case_sla.stagehand.ts`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/tests_stagehand/andres/F1_case_sla.stagehand.ts) y [`tests_stagehand/andres/run_stagehand_andres.ts`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/tests_stagehand/andres/run_stagehand_andres.ts).
- **Modelo LLM:** Google Gemini (`google/gemini-3.1-flash-lite`).
- **Primitivas Utilizadas:**
  - `stagehand.act()`: Acciones en lenguaje natural ("Type critical incident into subject field", "Select Urgent from priority").
  - `stagehand.observe()`: Descubrimiento dinámico de selectores interactivos sin acoplamiento a XPaths frágiles.
  - `stagehand.extract()`: Extracción semántica con tipado estricto mediante esquemas Zod.

### 2.2. Esquema Zod de Validación
```typescript
export const CaseViewSchema = z.object({
  caseTitle: z.string().describe("El título o nombre del caso mostrado en la vista de detalle"),
  status: z.string().describe("El estado actual del caso (e.g. New, Assigned, Pending)"),
  priority: z.string().describe("La prioridad asignada al caso (e.g. Urgent, High, Normal)")
});
```

### 2.3. Resultados de Ejecución
- **Total de Escenarios Evaluados:** 2 escenarios autónomos.
- **Tasa de Aprobación:** 100% (2/2 Aprobados).
- **Exportación de Evidencia:** [`docs/andres/stagehand_andres_results.json`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/andres/stagehand_andres_results.json).

---

## 3. HERRAMIENTA 2: EVALUACIÓN CUANTITATIVA CON DEEPEVAL 4.3.4

### 3.1. Componente de IA Evaluado: `CrmAiCopilot`
Se desarrolló e integró el componente [`tests_deepeval_andres/crm_ai_copilot.py`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/tests_deepeval_andres/crm_ai_copilot.py), un copiloto inteligente que asiste a los agentes de soporte y ventas de EspoCRM en:
1. Clasificación automática de severidad y cálculo de tiempo límite de SLA para incidentes de clientes.
2. Recomendación de descuentos escalonados y validación de políticas comerciales según tramos de volumen.

### 3.2. Métricas Formales de Evaluación
Archivo de prueba: [`tests_deepeval_andres/test_deepeval_crm.py`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/tests_deepeval_andres/test_deepeval_crm.py)

| Caso de Prueba | Funcionalidad | Métrica Evaluada | Umbral Requerido | Score Obtenido | Veredicto |
|---|---|---|---|---|---|
| **TC1** | F1 / F2: SLA Incidente Crítico | **G-Eval (Task Alignment)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |
| **TC1** | F1 / F2: SLA Incidente Crítico | **Answer Relevancy** | $\ge 0.80$ | **0.98 (98.0%)** | ✅ PASSED |
| **TC1** | F1 / F2: SLA Incidente Crítico | **Faithfulness (Hallucination-Free)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |
| **TC2** | F3: Descuento Escalonado | **G-Eval (Task Alignment)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |
| **TC2** | F3: Descuento Escalonado | **Answer Relevancy** | $\ge 0.80$ | **0.82 (82.0%)** | ✅ PASSED |
| **TC2** | F3: Descuento Escalonado | **Faithfulness (Hallucination-Free)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |

### 3.3. Resumen Consolidado de DeepEval
- **Promedio G-Eval:** **100.0%**
- **Promedio Answer Relevancy:** **90.0%**
- **Promedio Faithfulness:** **100.0%** (Cero alucinaciones detectadas)
- **Evidencia JSON:** [`docs/andres/deepeval_andres_results.json`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/andres/deepeval_andres_results.json).

---

## 4. HERRAMIENTA 3: MICROSOFT PLAYWRIGHT MCP (`@playwright/mcp`)

### 4.1. Concepto y Justificación
**Microsoft Playwright MCP** es la implementación oficial del estándar **Model Context Protocol** para automatización de navegadores. A diferencia de los scripts tradicionales acoplados a selectores CSS o XPath que se rompen con cambios visuales menores, Playwright MCP expone herramientas JSON-RPC sobre `stdio` permitiendo que un agente o evaluador interactúe directamente con el **árbol de accesibilidad semántico (Accessibility Tree)**.

### 4.2. Implementación del Cliente de Prueba
Archivo ejecutable: [`tests_playwright_mcp_andres/test_playwright_mcp.js`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/tests_playwright_mcp_andres/test_playwright_mcp.js)

Flujo ejecutado en tiempo real:
1. **Handshake Protocolar MCP:** Inicialización con protocolo `2024-11-05` y respuesta a solicitudes inversas de capacidades.
2. **Inspección de Herramientas (`tools/list`):** Identificación exitosa de las **25 herramientas** expuestas por el servidor de Microsoft (`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill_form`, etc.).
3. **Navegación Declarativa (`browser_navigate`):** Petición hacia `http://localhost:8080` retornando código generado:
   ```javascript
   await page.goto('http://localhost:8080');
   ```
4. **Captura Semántica de Accesibilidad (`browser_snapshot`):** Extracción del árbol de accesibilidad en formato estructurado, verificando roles ARIA (`textbox`, `button`, `heading`) en la interfaz de EspoCRM.

### 4.3. Resultados de Playwright MCP
- **Estado:** ✅ **100% GREEN (Todas las fases aprobadas en 3,648 ms)**.
- **Evidencias Generadas:**
  - Snapshot de accesibilidad: [`docs/andres/playwright_mcp_snapshot.txt`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/andres/playwright_mcp_snapshot.txt).
  - Resultados JSON: [`docs/andres/playwright_mcp_results.json`](file:///c:/Users/Andres%20Bedoya%20Cano/Desktop/2026_2/ma-validacion-verificacion-software/espo-crm/docs/andres/playwright_mcp_results.json).

---

## 5. APORTES Y LIMITACIONES DE LA INTELIGENCIA ARTIFICIAL EN TESTING

### 5.1. Aportes Clave
1. **Resiliencia ante Cambios de UI:** Herramientas como Stagehand y Playwright MCP desacoplan las pruebas de los selectores frágiles. Si un desarrollador altera una clase CSS o reestructura un div contenedor, la prueba no falla porque el LLM y el árbol de accesibilidad reconocen la semántica del elemento ("botón de guardar", "campo de asunto").
2. **Evaluación de Sistemas Probabilísticos:** DeepEval permite evaluar componentes de IA generativa con métricas estadísticas reproducibles (G-Eval, Faithfulness), superando la limitación de las aserciones booleanas tradicionales (`assertEquals`).
3. **Velocidad de Creación:** Generación ágil de flujos complejos a partir de instrucciones descriptivas en lenguaje natural.

### 5.2. Limitaciones y Riesgos
1. **No Determinismo:** Variaciones sutiles en la temperatura del modelo pueden inducir respuestas dispares en corridas consecutivas.
2. **Dependencia de Red y Latencia:** Las llamadas a APIs externas de LLMs añaden latencia (1.5s - 3s por interacción) frente a los microsegundos de un test unitario determinista.
3. **Costos Operativos:** El consumo continuo de tokens en pipelines de CI/CD masivos puede resultar inviable si no se complementa con suites estáticas o modelos locales cuantizados.
