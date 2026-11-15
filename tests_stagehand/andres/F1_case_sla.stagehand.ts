/**
 * F1_case_sla.stagehand.ts
 *
 * Suite de pruebas E2E impulsada por IA (Stagehand + LLM Routing) para:
 * Funcionalidad 1 & 2: Gestión de Casos de Soporte y Validación de SLA
 * Autor: Andrés Bedoya Cano (VyV 2026-2)
 *
 * Utiliza capacidades declarativas de lenguaje natural (`act`, `observe`, `extract`)
 * con esquemas estructurados de Zod para interactuar con EspoCRM.
 */

import { z } from "zod";
import { config } from "../stagehand.config.js";

// Esquema Zod para validación semántica de datos extraídos por el LLM
export const CaseViewSchema = z.object({
  caseTitle: z.string().describe("El título o nombre del caso mostrado en la vista de detalle"),
  status: z.string().describe("El estado actual del caso (e.g. New, Assigned, Pending)"),
  priority: z.string().describe("La prioridad asignada al caso (e.g. Urgent, High, Normal)")
});

export async function runCaseSlaStagehandTest(stagehand: any, page: any): Promise<{ passed: boolean; details: any }> {
  const uid = Date.now();
  const caseSubject = `Fallo crítico de pasarela de pagos [AI-Test-${uid}]`;

  console.log(`[Stagehand-AI] Navegando a creación de Caso...`);
  await page.goto(`${config.baseUrl}/#Case/create`, { waitUntil: "networkidle" });

  // 1. Interacción con LLM mediante comandos de lenguaje natural (act)
  console.log(`[Stagehand-AI] Ejecutando act: ingreso de nombre del caso...`);
  await stagehand.act(`Type "${caseSubject}" into the name or subject input field`);

  console.log(`[Stagehand-AI] Ejecutando act: selección de prioridad urgente...`);
  await stagehand.act('Select "Urgent" from the priority dropdown');

  console.log(`[Stagehand-AI] Ejecutando act: click en guardar caso...`);
  await stagehand.act('Click the Save button');

  // Esperar transición de URL
  await page.waitForTimeout(3000);

  // 2. Extracción semántica y verificación con Zod (extract)
  console.log(`[Stagehand-AI] Ejecutando extract: extracción de atributos del caso con Zod...`);
  const extracted = await stagehand.extract(
    "Extract the case subject/title, current status, and priority from the case header and fields",
    CaseViewSchema
  );

  console.log(`[Stagehand-AI] Datos extraídos por el LLM:`, extracted);

  const passed = extracted.priority.toLowerCase().includes("urgent") ||
                 extracted.caseTitle.includes(`AI-Test-${uid}`);

  return {
    passed,
    details: extracted
  };
}
