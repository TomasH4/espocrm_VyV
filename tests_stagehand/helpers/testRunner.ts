/**
 * helpers/testRunner.ts
 *
 * Harness para inicializar Stagehand con Gemini y gestionar el ciclo de vida de los tests.
 */

import { localBrowser, Stagehand } from "@browserbasehq/stagehand";
import { config } from "../stagehand.config.js";
import { loginToEspoCRM } from "./auth.js";

export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export class StagehandTestContext {
  private browser: any;
  public stagehand!: any;
  public page: any;
  public results: TestResult[] = [];

  async init(): Promise<void> {
    if (!config.apiKey) {
      throw new Error(
        "Falta la clave GEMINI_API_KEY o GOOGLE_API_KEY. Configúrala en tests_stagehand/.env o como variable de entorno."
      );
    }

    console.log(`[Stagehand] Inicializando navegador local con modelo ${config.modelName}...`);
    this.browser = await localBrowser.launch({
      headless: config.headless,
    });

    this.stagehand = await Stagehand.create({
      browser: this.browser,
      model: {
        modelName: config.modelName,
        apiKey: config.apiKey,
      },
      logging: {
        level: "warn",
        format: "pretty",
      },
    });

    const pages = await this.browser.context.pages();
    this.page = pages[0] || (await this.browser.context.newPage());

    await loginToEspoCRM(this.page, this.stagehand);
  }

  async runTest(name: string, fn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    console.log(`\n  ▶ Ejecutando: ${name}`);

    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        await fn();
        const durationMs = Date.now() - start;
        console.log(`    ✔ PASS (${durationMs}ms)`);
        this.results.push({ name, passed: true, durationMs });
        // Cooldown para mantenerse dentro del límite free tier (15 RPM)
        await new Promise((r) => setTimeout(r, 2000));
        return;
      } catch (err: any) {
        if (
          attempts < 2 &&
          (err.message?.includes("Quota exceeded") ||
            err.message?.includes("rate-limits") ||
            err.message?.includes("Please retry in"))
        ) {
          console.log(`    ⏳ Límite de tasa Gemini (15 RPM) detectado. Esperando 35s para enfriamiento...`);
          await new Promise((r) => setTimeout(r, 35000));
          continue;
        }
        const durationMs = Date.now() - start;
        console.error(`    ✖ FAIL (${durationMs}ms): ${err.message}`);
        this.results.push({ name, passed: false, durationMs, error: err.message });
        await new Promise((r) => setTimeout(r, 2000));
        return;
      }
    }
  }

  async close(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close().catch(() => {});
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
    }
  }

  printSummary(suiteName: string): boolean {
    console.log(`\n========================================================`);
    console.log(`  Resumen Suite Stagehand: ${suiteName}`);
    console.log(`========================================================`);
    let allPassed = true;
    for (const r of this.results) {
      const icon = r.passed ? "✔ PASS" : "✖ FAIL";
      console.log(`  ${icon} [${r.durationMs}ms] ${r.name}`);
      if (!r.passed) {
        allPassed = false;
        console.log(`       Error: ${r.error}`);
      }
    }
    const passedCount = this.results.filter((r) => r.passed).length;
    console.log(`\nTotal: ${this.results.length} | Pasaron: ${passedCount} | Fallaron: ${this.results.length - passedCount}`);
    console.log(`========================================================\n`);
    return allPassed;
  }
}

export async function waitForUrl(page: any, pattern: RegExp | string, timeout = 15000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const cur = (await page.evaluate(() => window.location.href)) as string;
    if (typeof pattern === "string" ? cur.includes(pattern) : pattern.test(cur)) {
      return cur;
    }
    await page.waitForTimeout(250);
  }
  const lastUrl = await page.evaluate(() => window.location.href).catch(() => "unknown");
  throw new Error(`Timeout (${timeout}ms) esperando URL que coincida con ${pattern}. URL actual: ${lastUrl}`);
}

export async function getUrl(page: any): Promise<string> {
  return (await page.evaluate(() => window.location.href)) as string;
}

export async function navigateTo(page: any, hash: string): Promise<void> {
  await page.evaluate((h: string) => {
    window.location.hash = h;
  }, hash);
  await page.waitForTimeout(1200);
}

export async function extractData<T = any>(
  stagehand: any,
  instruction: string,
  schema: any
): Promise<T> {
  const res = await stagehand.extract(instruction, schema);
  return ((res as any)?.data ?? res) as T;
}

export async function commitFormInputs(page: any): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll("input, select, textarea").forEach((el: any) => {
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      // No disparar blur en inputs numéricos porque AutoNumeric los resetea a vacío
      if (!el.classList.contains("numeric-text")) {
        el.dispatchEvent(new Event("blur", { bubbles: true }));
      }
    });
  });
}

export async function clickSaveAction(page: any, stagehand: any): Promise<void> {
  await commitFormInputs(page);
  await page.waitForTimeout(200);

  // Primero intentar disparar el evento MouseEvent nativo directo sobre el botón Save
  await page.evaluate(() => {
    const btn = (document.querySelector('button.btn-primary[data-action="save"]') ||
      document.querySelector('button[data-action="save"]')) as HTMLElement | null;
    if (btn) {
      btn.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    }
  });

  // Fallback con stagehand.act si el botón sigue visible y el hash no ha cambiado
  await page.waitForTimeout(500);
  const curUrl = await getUrl(page);
  if (!curUrl.includes("/view/")) {
    try {
      await stagehand.act('Click the "Save" button');
    } catch {}
  }
}

/**
 * Setea el valor de un <input> de forma segura sin disparar blur destructivo.
 */
export async function setInputValue(page: any, selector: string, value: string): Promise<void> {
  await page.evaluate(
    ({ sel, val }: { sel: string; val: string }) => {
      const inp = document.querySelector(sel) as HTMLInputElement | null;
      if (!inp) throw new Error(`Input no encontrado: ${sel}`);
      inp.value = val;
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { sel: selector, val: value }
  );
  await page.waitForTimeout(150);
}

/**
 * Selecciona un valor en un campo select/enum de EspoCRM (Selectize.js).
 * Replica cy.selectOption de Cypress.
 */
export async function selectEspoOption(page: any, fieldName: string, value: string): Promise<void> {
  await page.evaluate(
    ({ field, val }: { field: string; val: string }) => {
      const select = document.querySelector(`select[data-name="${field}"]`) as any;
      if (!select) {
        throw new Error(`No se encontró select[data-name="${field}"]`);
      }
      if (select.selectize) {
        select.selectize.setValue(val);
      } else {
        select.value = val;
      }
      select.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { field: fieldName, val: value }
  );
  await page.waitForTimeout(400);
}
