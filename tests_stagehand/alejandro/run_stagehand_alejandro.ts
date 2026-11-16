/**
 * run_stagehand_alejandro.ts
 *
 * Runner de las pruebas Stagehand del módulo CUR (Alejandro Bustamante).
 * Requiere GEMINI_API_KEY en tests_stagehand/.env (ignorado por git). Sin clave, termina con error:
 * no se simulan resultados.
 * Ejecutar desde tests_stagehand/:  npx tsx alejandro/run_stagehand_alejandro.ts
 * Guarda el resumen en ../docs/CUR/ia/stagehand-resultados.json
 */

import fs from "fs";
import path from "path";
import { localBrowser, Stagehand } from "@browserbasehq/stagehand";
import { config } from "../stagehand.config.js";
import { StagehandTestContext } from "../helpers/testRunner.js";
import {
  prepararEntorno, asegurarSesion, convertirEnSandbox, crearCampaniaEnCop, rechazarTasaNegativa, leerTasaVigente,
} from "./CUR_monedas.stagehand.js";

async function main(): Promise<void> {
  if (!config.apiKey) {
    console.error("Falta GEMINI_API_KEY (o GOOGLE_API_KEY) en tests_stagehand/.env. No se ejecuta nada.");
    process.exit(2);
  }

  console.log(`Stagehand CUR — modelo ${config.modelName} — ${config.baseUrl}`);
  const copId = await prepararEntorno();
  const ctx = new StagehandTestContext();

  try {
    // Mismo arranque que StagehandTestContext.init(), pero sin helpers/auth.ts: ese login hace clic dentro de un
    // page.evaluate y, cuando encuentra el formulario, el re-render de EspoCRM lanza «Uncaught». Se usa asegurarSesion().
    const browser = await localBrowser.launch({ headless: config.headless });
    ctx.stagehand = await Stagehand.create({
      browser,
      model: { modelName: config.modelName, apiKey: config.apiKey },
      logging: { level: "warn", format: "pretty" },
    });
    (ctx as any).browser = browser;
    const pages = await browser.context.pages();
    ctx.page = pages[0] || (await browser.context.newPage());
    await ctx.page.goto(config.baseUrl);
    await asegurarSesion(ctx.page);
    // Pestaña nueva por escenario: un formulario a medio llenar no puede bloquear al siguiente con el aviso de
    // «salir sin guardar». La sesión se conserva porque las cookies son del contexto del navegador.
    const pestanaNueva = async () => {
      const anterior = ctx.page;
      ctx.page = await browser.context.newPage();
      await anterior.close().catch(() => undefined);
    };
    const escenarios: [string, () => Promise<void>][] = [
      ["ST-CUR-01 CUR-F1 Convertir 100 USD a COP en el Formula Sandbox", () => convertirEnSandbox(ctx.stagehand, ctx.page)],
      ["ST-CUR-02 CUR-F3 Crear campaña con presupuesto en COP", () => crearCampaniaEnCop(ctx.stagehand, ctx.page)],
      ["ST-CUR-03 CUR-F5 Rechazar tasa negativa en el formulario", () => rechazarTasaNegativa(ctx.stagehand, ctx.page, copId)],
      ["ST-CUR-04 CUR-F4/F5 Tasa en pantalla igual a la de la API", () => leerTasaVigente(ctx.stagehand, ctx.page, copId)],
    ];
    for (const [nombre, fn] of escenarios) {
      await pestanaNueva();
      await ctx.runTest(nombre, fn);
    }
  } finally {
    await ctx.close();
  }

  const ok = ctx.printSummary("CUR Moneda y tasas (Stagehand)");
  const out = path.resolve(process.cwd(), "../docs/CUR/ia/stagehand-resultados.json");

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ fecha: new Date().toISOString(), modelo: config.modelName, resultados: ctx.results }, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
