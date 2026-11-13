/**
 * F1_lead_creation.stagehand.ts
 *
 * Suite de pruebas E2E con Stagehand + Google Gemini para:
 * Funcionalidad 1: Creación de un Cliente Potencial (Lead Creation)
 *
 * Replica los 5 escenarios probados en cypress/e2e/F1_lead_creation.cy.js
 * utilizando lenguaje natural con Gemini (`stagehand.act` y `stagehand.extract`).
 */

import { z } from "zod";
import {
  StagehandTestContext,
  waitForUrl,
  getUrl,
  navigateTo,
  extractData,
  clickSaveAction,
} from "./helpers/testRunner.js";
import { deleteEntityViaApi } from "./helpers/api.js";
import { config } from "./stagehand.config.js";

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

      // Acciones en lenguaje natural ejecutadas por Gemini + Stagehand
      await stagehand.act('Type "Carlos" into the first name field');
      await stagehand.act(`Type "${lastName}" into the last name field`);
      await stagehand.act(`Type "${email}" into the email address field`);
      await stagehand.act('Type "+573001234567" into the phone number field');
      await clickSaveAction(page, stagehand);

      // Esperar navegación a la vista del Lead
      await waitForUrl(page, /#Lead\/view\//, 15000);

      // Extracción de datos con validación semántica Zod
      const data = await extractData<{ displayedName: string }>(
        stagehand,
        "Extract the displayed Lead name from the view header",
        z.object({
          displayedName: z.string(),
        })
      );

      if (!data.displayedName.includes(lastName)) {
        throw new Error(`El nombre en pantalla "${data.displayedName}" no contiene "${lastName}"`);
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

      await stagehand.act(`Type "${lastName}" into the last name field`);
      await clickSaveAction(page, stagehand);

      await waitForUrl(page, /#Lead\/view\//, 15000);

      const data = await extractData<{ headerName: string }>(
        stagehand,
        "Extract the lead name displayed in the header",
        z.object({
          headerName: z.string(),
        })
      );

      if (!data.headerName.includes(lastName)) {
        throw new Error(`El encabezado "${data.headerName}" no contiene "${lastName}"`);
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

      await stagehand.act('Type "NombreSinApellido" into the first name field');
      await page.evaluate(() => {
        const lastNameInput: any = document.querySelector('input[data-name="lastName"]');
        if (lastNameInput) {
          lastNameInput.value = "";
          lastNameInput.dispatchEvent(new Event("input", { bubbles: true }));
          lastNameInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
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

      await stagehand.act('Type "Perez" into the last name field');
      await stagehand.act('Type "invalido-sin-arroba" into the email input');
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

      const formCheck = await extractData<{
        hasNameField: boolean;
        hasSaveButton: boolean;
      }>(
        stagehand,
        "Check whether this Lead form has input fields for the contact name and a Save button",
        z.object({
          hasNameField: z.boolean(),
          hasSaveButton: z.boolean(),
        })
      );

      if (!formCheck.hasNameField || !formCheck.hasSaveButton) {
        throw new Error("Faltan controles esenciales en el formulario de creación de Lead");
      }
    });

  } finally {
    // Limpieza de entidades creadas (FIRST - Independent)
    for (const id of createdLeadIds) {
      await deleteEntityViaApi("Lead", id);
    }
    ctx.printSummary("F1: Creación de Lead (Stagehand + Gemini)");
    await ctx.close();
  }
}

main().catch(console.error);
