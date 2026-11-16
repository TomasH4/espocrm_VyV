/**
 * F1_lead_creation.stagehand.ts
 *
 * Suite de pruebas E2E con Stagehand + Google Gemini para:
 * Funcionalidad 1: Creación de un Cliente Potencial (Lead Creation)
 *
 * Replica los 5 escenarios probados en cypress/e2e/F1_lead_creation.cy.js
 * utilizando lenguaje natural con Gemini (`stagehand.extract`) y manipulación
 * DOM robusta para campos de formulario.
 */

import { z } from "zod";
import {
  StagehandTestContext,
  waitForUrl,
  getUrl,
  navigateTo,
  extractData,
  clickSaveAction,
  setInputValue,
} from "../helpers/testRunner.js";
import { deleteEntityViaApi } from "../helpers/api.js";
import { config } from "../stagehand.config.js";

async function main() {
  const ctx = new StagehandTestContext();
  const createdLeadIds: string[] = [];

  try {
    await ctx.init();
    const { stagehand, page } = ctx;

    // -------------------------------------------------------------------------
    // Test 1: [Exitoso] Crea un Lead con todos los campos válidos
    // -------------------------------------------------------------------------
    await ctx.runTest("[Exitoso] Crea un Lead con todos los campos válidos y verifica persistencia", async () => {
      const uid = Date.now();
      const lastName = `Gómez${uid}`;
      const email = `carlos.${uid}@empresa.com`;

      await navigateTo(page, "#Lead/create");
      await page.waitForTimeout(1000);

      // Manipulación DOM directa y segura
      await setInputValue(page, 'input[data-name="firstName"]', "Carlos");
      await setInputValue(page, 'input[data-name="lastName"]', lastName);
      await setInputValue(page, 'input.email-address, input[data-name="emailAddress"]', email);
      await setInputValue(page, 'input.phone-number, input[data-name="phoneNumber"]', "+573001234567");
      await clickSaveAction(page, stagehand);

      // Esperar navegación a la vista del Lead
      await waitForUrl(page, /#Lead\/view\//, 20000);

      // Extracción de datos con validación semántica Zod (con fallback resiliente ante congestión de API)
      let displayedName = "";
      try {
        const data = await extractData<{ displayedName: string }>(
          stagehand,
          "Extract the displayed Lead name from the view header",
          z.object({
            displayedName: z.string(),
          }),
          30000
        );
        displayedName = data.displayedName;
      } catch (err: any) {
        console.log(`    ⚠️ Gemini API congestion (${err.message}). Evaluando vía DOM fallback...`);
        displayedName = await page.evaluate(() => {
          const header = document.querySelector(".header-title, .detail-header, h3, h4, .title");
          return header ? header.textContent?.trim() || "" : document.body.innerText;
        });
      }

      if (!displayedName.includes(lastName)) {
        throw new Error(`El nombre en pantalla "${displayedName}" no contiene "${lastName}"`);
      }

      const curUrl = await getUrl(page);
      const match = curUrl.match(/#Lead\/view\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        createdLeadIds.push(match[1]);
      }
    });

    // -------------------------------------------------------------------------
    // Test 2: [Alternativo] Crea un Lead únicamente con el apellido obligatorio
    // -------------------------------------------------------------------------
    await ctx.runTest("[Alternativo] Crea un Lead únicamente con apellido obligatorio", async () => {
      const uid = Date.now();
      const lastName = `Torres${uid}`;

      await navigateTo(page, "#Lead/create");
      await page.waitForTimeout(1000);

      // Solo apellido obligatorio - DOM directo
      await setInputValue(page, 'input[data-name="lastName"]', lastName);
      await clickSaveAction(page, stagehand);

      await waitForUrl(page, /#Lead\/view\//, 20000);

      let headerName = "";
      try {
        const data = await extractData<{ headerName: string }>(
          stagehand,
          "Extract the lead name displayed in the header",
          z.object({
            headerName: z.string(),
          }),
          30000
        );
        headerName = data.headerName;
      } catch (err: any) {
        console.log(`    ⚠️ Gemini API congestion (${err.message}). Evaluando vía DOM fallback...`);
        headerName = await page.evaluate(() => {
          const header = document.querySelector(".header-title, .detail-header, h3, h4, .title");
          return header ? header.textContent?.trim() || "" : document.body.innerText;
        });
      }

      if (!headerName.includes(lastName)) {
        throw new Error(`El encabezado "${headerName}" no contiene "${lastName}"`);
      }

      const curUrl = await getUrl(page);
      const match = curUrl.match(/#Lead\/view\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        createdLeadIds.push(match[1]);
      }
    });

    // -------------------------------------------------------------------------
    // Test 3: [Error] Rechaza la creación cuando el apellido está vacío o solo espacios
    // -------------------------------------------------------------------------
    await ctx.runTest("[Error] Rechaza la creación cuando el apellido está vacío", async () => {
      await navigateTo(page, "#Lead/create");
      await page.waitForTimeout(1000);

      // Limpiar firstName e ingresar solo espacios en lastName (cumple validación de obligatoriedad)
      await setInputValue(page, 'input[data-name="firstName"]', "");
      await setInputValue(page, 'input[data-name="lastName"]', "     ");
      await clickSaveAction(page, stagehand);

      await page.waitForTimeout(2000);

      const curUrl = await getUrl(page);
      if (!curUrl.includes("#Lead/create")) {
        throw new Error(`El sistema navegó indebidamente a ${curUrl} con apellido vacío`);
      }
    });

    // -------------------------------------------------------------------------
    // Test 4: [Error] Rechaza la creación cuando el email tiene un formato inválido
    // -------------------------------------------------------------------------
    await ctx.runTest("[Error] Rechaza la creación cuando el email tiene un formato inválido", async () => {
      await navigateTo(page, "#Lead/create");
      await page.waitForTimeout(1000);

      // Apellido válido + email inválido
      await setInputValue(page, 'input[data-name="lastName"]', "Perez");
      await setInputValue(page, 'input.email-address, input[data-name="emailAddress"]', "invalido-sin-arroba");
      await clickSaveAction(page, stagehand);

      await page.waitForTimeout(2000);

      const curUrl = await getUrl(page);
      if (!curUrl.includes("#Lead/create")) {
        throw new Error("El sistema guardó un email inválido sin arroba");
      }
    });

    // -------------------------------------------------------------------------
    // Test 5: [Invariante UI] Verificación de estructura del formulario
    // -------------------------------------------------------------------------
    await ctx.runTest("[Invariante UI] El formulario de Lead contiene los campos requeridos", async () => {
      await navigateTo(page, "#Lead/create");
      await page.waitForTimeout(1000);

      const hasRequiredElements = await page.evaluate(() => {
        const hasLastName = !!document.querySelector('input[data-name="lastName"]');
        const hasFirstName = !!document.querySelector('input[data-name="firstName"]');
        const hasSave = !!(
          document.querySelector('button.btn-primary[data-action="save"]') ||
          document.querySelector('button[data-action="save"]')
        );
        return hasLastName && hasFirstName && hasSave;
      });

      if (!hasRequiredElements) {
        throw new Error("Faltan controles esenciales en el formulario de creación de Lead");
      }
    });

  } finally {
    // Limpieza de entidades creadas (FIRST - Independent)
    for (const id of createdLeadIds) {
      await deleteEntityViaApi("Lead", id).catch(() => {});
    }
    ctx.printSummary("F1: Creación de Lead (Stagehand + Gemini)");
    await ctx.close();
  }
}

main().catch(console.error);
