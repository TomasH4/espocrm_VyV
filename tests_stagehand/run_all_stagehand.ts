/**
 * run_all_stagehand.ts
 *
 * Ejecutor maestro de toda la suite de pruebas E2E con Stagehand + Google Gemini
 * para las 5 funcionalidades de VyV EspoCRM.
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const suites = [
  { name: "F1: Creación de Lead", file: "F1_lead_creation.stagehand.ts" },
  { name: "F2: Probabilidad Oportunidades", file: "F2_opportunity_probability.stagehand.ts" },
  { name: "F3: Búsqueda de Contactos", file: "F3_contact_search.stagehand.ts" },
  { name: "F4: Programación de Reuniones", file: "F4_meeting_scheduling.stagehand.ts" },
  { name: "F5: Conversión de Lead", file: "F5_lead_conversion.stagehand.ts" },
];

console.log(`\n================================================================`);
console.log(`  SUITE COMPLETA DE PRUEBAS E2E CON STAGEHAND + GOOGLE GEMINI  `);
console.log(`================================================================`);
console.log(`Iniciando ejecución de ${suites.length} suites de pruebas...\n`);

const results: { name: string; status: "PASS" | "FAIL"; durationMs: number }[] = [];

for (const suite of suites) {
  const start = Date.now();
  console.log(`>>> Ejecutando suite: ${suite.name} (${suite.file})...`);
  try {
    execSync(`npx tsx ${path.join(__dirname, suite.file)}`, {
      stdio: "inherit",
      cwd: __dirname,
    });
    const durationMs = Date.now() - start;
    results.push({ name: suite.name, status: "PASS", durationMs });
  } catch (err) {
    const durationMs = Date.now() - start;
    results.push({ name: suite.name, status: "FAIL", durationMs });
    console.error(`Error ejecutando suite ${suite.name}`);
  }
  // Cooldown entre suites para mantenerse dentro de los límites de Gemini Free Tier
  execSync("powershell -Command Start-Sleep -Seconds 5");
}

console.log(`\n================================================================`);
console.log(`  RESUMEN GLOBAL CONSOLIDADO - STAGEHAND + GOOGLE GEMINI        `);
console.log(`================================================================`);
let allPassed = true;
for (const r of results) {
  const icon = r.status === "PASS" ? "✔ PASS" : "✖ FAIL";
  console.log(`  ${icon} [${Math.round(r.durationMs / 1000)}s] ${r.name}`);
  if (r.status === "FAIL") allPassed = false;
}
console.log(`================================================================\n`);

process.exit(allPassed ? 0 : 1);

