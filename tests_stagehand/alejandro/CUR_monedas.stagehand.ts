/**
 * CUR_monedas.stagehand.ts
 *
 * Pruebas E2E guiadas por IA (Stagehand + Gemini) del módulo Moneda y tasas de cambio (CUR).
 * Autor: Alejandro Bustamante (VyV 2026-2)
 *
 * La IA interpreta la pantalla en lenguaje natural:
 *   act      → acciones («haz clic en Run», «elige COP en la moneda del presupuesto»)
 *   extract  → lectura estructurada de la pantalla validada con esquemas Zod
 *   observe  → localizar elementos sin conocer sus selectores
 * El oráculo NO es la IA: cada resultado se contrasta con la API de EspoCRM (verdad de referencia).
 *
 * Sin GEMINI_API_KEY la ejecución falla de forma explícita: no hay resultados simulados.
 * Ejecutar: npx tsx alejandro/run_stagehand_alejandro.ts   (desde tests_stagehand/)
 */

import { z } from "zod";
import { config } from "../stagehand.config.js";

const COP_RATE = 0.00025;
const auth = () => "Basic " + Buffer.from(`${config.user}:${config.pass}`).toString("base64");

async function api(method: string, path: string, body?: unknown): Promise<{ status: number; body: any; reason: string | null }> {
  const res = await fetch(`${config.baseUrl}/api/v1/${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: auth() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: any = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* cuerpo no JSON */
  }
  return { status: res.status, body: parsed, reason: res.headers.get("x-status-reason") };
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    throw new Error(`Aserción fallida: ${msg}`);
  }
}

export async function prepararEntorno(): Promise<string> {
  const r = await api("PUT", "CurrencyRate", { COP: COP_RATE });
  assert(r.status === 200, `no se pudo fijar la tasa de COP (HTTP ${r.status})`);
  const list = await api("GET", "CurrencyRecord?maxSize=50");
  const cop = (list.body.list || []).find((x: any) => x.code === "COP");
  assert(cop, "registro de moneda COP");
  return cop.id;
}

/**
 * Inicia sesión de forma robusta. helpers/auth.ts del equipo revisa la pantalla de acceso a 1 s de cargar, cuando
 * EspoCRM aún no la ha montado, y entonces no inicia sesión. Aquí se espera a que aparezca el formulario o la app.
 */
export async function asegurarSesion(page: any): Promise<void> {
  // Durante las transiciones de la SPA el contexto de la página puede destruirse: se reintenta como «cargando».
  const estado = async (): Promise<string> =>
    page
      .evaluate(() => (document.querySelector("#field-userName") ? "login" : document.querySelector("#main .page-header, #main .record, .navbar-nav") ? "app" : "cargando"))
      .catch(() => "cargando");

  let e = "cargando";
  for (let i = 0; i < 60 && e === "cargando"; i++) {
    e = await estado();
    if (e === "cargando") await page.waitForTimeout(500);
  }

  if (e === "login") {
    // Solo se asignan los valores (EspoCRM los lee del formulario al pulsar Log in). Disparar eventos input/change
    // a mano hace fallar un manejador de la página («Uncaught»). El clic va después de devolver el evaluate.
    await page
      .evaluate(({ user, pass }: { user: string; pass: string }) => {
        (document.querySelector("#field-userName") as HTMLInputElement).value = user;
        (document.querySelector("#field-password") as HTMLInputElement).value = pass;
        setTimeout(() => (document.querySelector("#btn-login") as HTMLElement).click(), 0);
        return true;
      }, { user: config.user, pass: config.pass })
      .catch((e: Error) => console.log(`[Auth] aviso del navegador al enviar el formulario: ${e.message}`));

    for (let i = 0; i < 60 && (await estado()) !== "app"; i++) await page.waitForTimeout(500);
  }

  assert((await estado()) === "app", "no se pudo iniciar sesión en EspoCRM");
  console.log(`[Auth] Sesión activa como ${config.user}`);
}

/** Carga la vista con recarga completa. Antes quita el aviso de «salir sin guardar» de un formulario a medio llenar. */
async function irA(page: any, hash: string, listo: string): Promise<void> {
  await page.evaluate(() => {
    window.onbeforeunload = null;
    window.addEventListener("beforeunload", (e) => e.stopImmediatePropagation(), true);
  }).catch(() => undefined);
  await page.goto(`${config.baseUrl}/?r=${Date.now()}${hash}`);
  await page.waitForSelector(listo, { timeout: 30000 });
  await page.waitForTimeout(800);
}

/** Espera hasta que una condición del DOM se cumpla (verificación determinista después de cada paso de la IA). */
async function esperarDom(page: any, descripcion: string, fn: () => boolean, ms = 10000): Promise<void> {
  for (let i = 0; i < ms / 250; i++) {
    if (await page.evaluate(fn).catch(() => false)) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`después de la acción de la IA no se cumplió: ${descripcion}`);
}

/** Stagehand 4 devuelve { data, metadata } en extract; versiones anteriores devolvían el objeto directamente. */
async function extraer<T>(stagehand: any, instruccion: string, schema: any): Promise<T> {
  const r = await stagehand.extract(instruccion, schema);
  return (r && r.data !== undefined ? r.data : r) as T;
}

/**
 * La IA primero localiza el elemento (observe) y después ejecuta la acción sobre esa referencia (act).
 * Es más preciso que un act directo, que con modelos pequeños puede responder «ok» tras pulsar otro elemento.
 */
async function observarYActuar(stagehand: any, instruccion: string): Promise<void> {
  // Stagehand 4.4: observe → { data: Action[], metadata } y act → { data: { success, message, … }, metadata }.
  const obs = await stagehand.observe(instruccion);
  const lista = Array.isArray(obs) ? obs : obs?.data || [];
  const accion = lista[0];
  if (!accion) throw new Error(`la IA no localizó: ${instruccion}`);
  console.log(`    [observe] ${instruccion} → ${accion.description || accion.selector} (${accion.method || "click"})`);
  const r = await stagehand.act(accion);
  const res = r?.data ?? r;
  if (!res || res.success !== true) throw new Error(`la IA no pudo: ${instruccion} (${res?.message || "sin mensaje"})`);
}

/**
 * La IA localiza el campo (observe) y se escribe tecla por tecla sobre esa referencia. Los campos numéricos de
 * EspoCRM usan la máscara AutoNumeric, que ignora un valor asignado por script (lo que hace «fill»): con fill el
 * formulario respondía «Rate is required» aunque el campo se viera lleno.
 */
async function observarYTeclear(stagehand: any, page: any, instruccion: string, texto: string, enter = false): Promise<void> {
  const obs = await stagehand.observe(instruccion);
  const accion = (Array.isArray(obs) ? obs : obs?.data || [])[0];
  if (!accion) throw new Error(`la IA no localizó: ${instruccion}`);
  console.log(`    [observe] ${instruccion} → ${accion.description || accion.selector} (teclear «${texto}»)`);
  const campo = page.locator(accion.selector);
  await campo.click();
  await page.type(texto);
  if (enter) await page.keyPress("Enter");
}

// ─────────────────────────────────────────────────────────────── Esquemas Zod

export const SandboxOutputSchema = z.object({
  output: z.string().describe("The exact text shown in the Output field of the Formula Sandbox, without the label"),
});

export const CampaignBudgetSchema = z.object({
  budgetAmount: z.string().describe("The budget amount shown in the campaign detail, digits and separators only, without currency symbol"),
  budgetCurrency: z.string().describe("The three-letter currency code of the budget if shown, otherwise an empty string"),
});

export const ValidationMessageSchema = z.object({
  message: z.string().describe("The validation error message shown next to the Rate field of the dialog"),
});

export const CurrentRateSchema = z.object({
  rate: z.string().describe("The current exchange rate value shown for this currency on the record (the number only)"),
});

// ─────────────────────────────────────────────────────────────── Escenarios

/** ST-CUR-01 (CUR-F1, CN-CUR-F1-01): convertir 100 USD a COP en el Formula Sandbox y leer el resultado con IA. */
export async function convertirEnSandbox(stagehand: any, page: any): Promise<void> {
  await irA(page, "#Admin/formulaSandbox", '.field[data-name="script"] .ace_editor');
  // El editor ace es un componente de código: se escribe directamente para no depender del LLM en el tecleo.
  await page.evaluate(() => {
    const el = document.querySelector('.field[data-name="script"] .ace_editor') as any;
    el.env.editor.setValue("output\\print(ext\\currency\\convert(100, 'USD', 'COP'));", 1);
  });

  await observarYActuar(stagehand, "Click the Run button of the Formula Sandbox");
  try {
    await esperarDom(page, "el campo Output muestra un número", () => /\d/.test(document.querySelector('.field[data-name="output"]')?.textContent || ""));
  } catch (e: any) {
    const visto = await page.evaluate(() => (document.querySelector('.field[data-name="output"]')?.textContent || "").trim()).catch(() => "?");
    throw new Error(`${e.message}; el campo Output contiene «${visto}»`);
  }

  const { output } = await extraer<{ output: string }>(stagehand, "Extract the text of the Output field", SandboxOutputSchema);
  console.log(`    [extract] Output = ${output}`);

  assert(String(output).includes("400000"), `el Output debería mostrar 400000.00000000000000 y la IA leyó «${output}»`);
}

/** ST-CUR-02 (CUR-F3, CN-CUR-F3-02): crear una campaña con presupuesto en COP solo con instrucciones en lenguaje natural. */
export async function crearCampaniaEnCop(stagehand: any, page: any): Promise<void> {
  const nombre = `CUR-Stagehand ${Date.now()}`;
  let campaignId: string | null = null;

  await irA(page, "#Campaign/create", '.field[data-name="budget"]');

  try {
    await observarYActuar(stagehand, `Fill the Name field with "${nombre}"`);
    await esperarDom(page, "el nombre quedó escrito", () => ((document.querySelector('.field[data-name="name"] input') as HTMLInputElement)?.value || "").startsWith("CUR-Stagehand"));

    await observarYTeclear(stagehand, page, "Find the Budget amount input (the number field, not the currency selector)", "2500000");
    await esperarDom(page, "el monto quedó escrito", () => ((document.querySelector('.field[data-name="budget"] input[data-name="budget"]') as HTMLInputElement)?.value || "").replace(/\D/g, "").startsWith("2500000"));

    // El selector de moneda es un control Selectize: sus opciones no aparecen en lo que la IA ve hasta abrirse.
    // La IA lo abre y escribe «COP» + Enter, como lo haría una persona con el teclado.
    await observarYTeclear(stagehand, page, "Find the currency dropdown located right next to the Budget amount input", "COP", true);
    await esperarDom(page, "la moneda elegida es COP", () => (document.querySelector('select[data-name="budgetCurrency"]') as HTMLSelectElement)?.value === "COP");

    await observarYActuar(stagehand, "Click the Save button of the campaign form");
    await esperarDom(page, "la campaña se guardó y se abrió su detalle", () => /#Campaign\/view\//.test(location.href), 15000);

    campaignId = await page.evaluate(() => location.hash.split("/").pop() || null);
    const extraido = await extraer<{ budgetAmount: string; budgetCurrency: string }>(stagehand, "Extract the budget amount and its currency from the campaign detail view", CampaignBudgetSchema);
    console.log(`    [extract] Budget = ${JSON.stringify(extraido)}`);

    // Oráculo: la API dice qué se guardó realmente.
    const guardada = await api("GET", `Campaign/${campaignId}`);
    assert(guardada.body.budget === 2500000 && guardada.body.budgetCurrency === "COP", `se guardó ${guardada.body.budget} ${guardada.body.budgetCurrency}`);
    assert(String(extraido.budgetAmount).replace(/[^\d]/g, "").startsWith("2500000"), `la IA leyó el monto «${extraido.budgetAmount}»`);
  } finally {
    if (campaignId) await api("DELETE", `Campaign/${campaignId}`);
  }
}

/** ST-CUR-03 (CUR-F5, CN-CUR-F5-08): una tasa negativa en el formulario se rechaza; la IA lee el mensaje. */
export async function rechazarTasaNegativa(stagehand: any, page: any, copId: string): Promise<void> {
  const q = `CurrencyRecordRate?maxSize=200&where[0][type]=equals&where[0][attribute]=recordId&where[0][value]=${copId}`;
  const antes = (await api("GET", q)).body.total;

  await irA(page, `#CurrencyRecord/view/${copId}`, '.panel[data-name="rates"]');

  await observarYActuar(stagehand, "Click the button that creates a new rate in the Rates panel");
  await esperarDom(page, "se abrió el diálogo de nueva tasa", () => !!document.querySelector('.modal .field[data-name="rate"] input'));

  await observarYTeclear(stagehand, page, "Find the Rate input inside the Create Exchange Rate dialog", "-1");
  await observarYActuar(stagehand, "Click the Save button inside the dialog");
  await esperarDom(page, "aparece un aviso de validación", () => !!document.querySelector(".popover"));

  const { message } = await extraer<{ message: string }>(stagehand, "Extract the validation error shown for the Rate field", ValidationMessageSchema);
  console.log(`    [extract] Mensaje = ${message}`);

  const despues = (await api("GET", q)).body.total;
  assert(/0\.0001/.test(String(message)), `el mensaje debería citar el mínimo 0.0001 y la IA leyó «${message}»`);
  assert(despues === antes, `no debería haberse creado ninguna tasa (${antes} → ${despues})`);
}

/** ST-CUR-04 (CUR-F4 y F5): la tasa que muestra la pantalla de COP coincide con la de la API. */
export async function leerTasaVigente(stagehand: any, page: any, copId: string): Promise<void> {
  await irA(page, `#CurrencyRecord/view/${copId}`, '.panel[data-name="rates"]');

  const { rate } = await extraer<{ rate: string }>(stagehand, "Extract the current exchange rate of this currency", CurrentRateSchema);
  console.log(`    [extract] Tasa en pantalla = ${rate}`);

  const tasas = await api("GET", "CurrencyRate");
  assert(Math.abs(parseFloat(String(rate)) - tasas.body.COP) < 1e-9, `pantalla ${rate} vs API ${tasas.body.COP}`);
}
