# TRÍADA DE TESTING CON INTELIGENCIA ARTIFICIAL — TOMÁS HENAO

**Autor:** Tomás Henao (VyV 2026-2)  
**Proyecto:** EspoCRM Testing Framework (Versión 10.1.0)  
**Herramientas de IA:** Stagehand (`@browserbasehq/stagehand`), DeepEval 4.3.4, Microsoft Playwright MCP (`@playwright/mcp`)  

---

## 1. INTRODUCCIÓN Y OBJETIVOS

En el marco del proyecto de Validación y Verificación de Software, se diseñó e implementó una **Tríada de Inteligencia Artificial** para validar los flujos de negocio asignados a Tomás Henao:
1. **F1:** Creación y persistencia de Clientes Potenciales (Lead Creation).
2. **F2:** Predicción y asignación de probabilidad en Oportunidades según etapa de negocio.
3. **F3:** Búsqueda exacta y filtrado parcial de Contactos.
4. **F4:** Programación y validación temporal de Reuniones con cálculo de duración.
5. **F5:** Conversión transaccional de Leads (B2B vs B2C).

---

## 2. HERRAMIENTA 1: AUTOMATIZACIÓN E2E BASADA EN LLM CON STAGEHAND

- **Tecnología:** `@browserbasehq/stagehand` con Google Gemini (`gemini-3.1-flash-lite`).
- **Ubicación:** `tests_stagehand/tomas/`
- **Tasa de Aprobación:** 100% (5/5 Pasando en `F1_lead_creation.stagehand.ts`).
- **Resumen:** Manipulación robusta del DOM combinada con extracción semántica validada mediante Zod schemas.

---

## 3. HERRAMIENTA 2: EVALUACIÓN CUANTITATIVA CON DEEPEVAL 4.3.4

### 3.1. Componente Inteligente Evaluado: `TomasCrmAiCopilot`
Ubicado en `tests_deepeval_tomas/tomas_ai_copilot.py`, este copiloto asiste a los usuarios en:
1. **Calificación de Leads (F1 / F5):** Evaluación de completitud y recomendación de conversión transaccional (B2B Contacto + Cuenta vs B2C Contacto).
2. **Probabilidad de Pipeline (F2):** Asignación probabilística ponderada según la etapa de negocio (`Prospecting` 10%, `Proposal` 50%, `Won` 100%, etc.).
3. **Planificación Temporal (F4):** Cálculo automático de duración de reuniones y verificación de consistencia temporal (`dateStart < dateEnd`).

### 3.2. Métricas Formales de DeepEval
Archivo ejecutable: [`tests_deepeval_tomas/test_deepeval_tomas.py`](file:///C:/Users/Daniel/Desktop/Tomas/vyv_final/espocrm_VyV/tests_deepeval_tomas/test_deepeval_tomas.py)

| Caso de Prueba | Funcionalidad | Métrica Evaluada | Umbral | Score | Veredicto |
|---|---|---|---|---|---|
| **TC1** | F1 / F5: Calificación Lead B2B | **G-Eval (Task Alignment)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |
| **TC1** | F1 / F5: Calificación Lead B2B | **Answer Relevancy** | $\ge 0.80$ | **0.95 (95.0%)** | ✅ PASSED |
| **TC1** | F1 / F5: Calificación Lead B2B | **Faithfulness (Hallucination-Free)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |
| **TC2** | F2: Probabilidad en Oportunidad | **G-Eval (Task Alignment)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |
| **TC2** | F2: Probabilidad en Oportunidad | **Answer Relevancy** | $\ge 0.80$ | **0.88 (88.0%)** | ✅ PASSED |
| **TC2** | F2: Probabilidad en Oportunidad | **Faithfulness (Hallucination-Free)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |
| **TC3** | F4: Duración de Reunión | **G-Eval (Task Alignment)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |
| **TC3** | F4: Duración de Reunión | **Answer Relevancy** | $\ge 0.80$ | **0.82 (82.0%)** | ✅ PASSED |
| **TC3** | F4: Duración de Reunión | **Faithfulness (Hallucination-Free)** | $\ge 0.85$ | **1.00 (100%)** | ✅ PASSED |

### 3.3. Resumen Consolidado de DeepEval Tomás
- **Promedio G-Eval:** **100.0%**
- **Promedio Answer Relevancy:** **88.3%**
- **Promedio Faithfulness:** **100.0%** (Cero alucinaciones detectadas)
- **Evidencia JSON:** [`docs/tomas/deepeval_tomas_results.json`](file:///C:/Users/Daniel/Desktop/Tomas/vyv_final/espocrm_VyV/docs/tomas/deepeval_tomas_results.json)
