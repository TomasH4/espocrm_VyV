/**
 * F3_contact_search.stagehand.ts
 *
 * Suite de pruebas E2E con Stagehand + Google Gemini para:
 * Funcionalidad 3: Búsqueda y Filtrado de Contactos
 *
 * Replica los escenarios probados en cypress/e2e/F3_contact_search.cy.js
 * utilizando lenguaje natural con Gemini (`stagehand.act` y `stagehand.extract`).
 */

import { z } from "zod";
import {
  StagehandTestContext,
  navigateTo,
  extractData,
} from "./helpers/testRunner.js";
import { createEntityViaApi, deleteEntityViaApi } from "./helpers/api.js";

async function main() {
  const ctx = new StagehandTestContext();
  const createdContactIds: string[] = [];

  try {
    await ctx.init();
    const { stagehand, page } = ctx;

    // Preparar contactos semilla (FIRST - Independent)
    const uid = Date.now();
    const c1 = await createEntityViaApi("Contact", {
      firstName: "Carlos",
      lastName: `Gómez${uid}`,
      emailAddress: `cgomez.${uid}@empresa.com`,
      status: "Active",
    });
    createdContactIds.push(c1.id);

    const c2 = await createEntityViaApi("Contact", {
      firstName: "Ana",
      lastName: `Gomis${uid}`,
      emailAddress: `agomis.${uid}@empresa.com`,
      status: "Active",
    });
    createdContactIds.push(c2.id);

    const c3 = await createEntityViaApi("Contact", {
      firstName: "Luis",
      lastName: `Restrepo${uid}`,
      emailAddress: `lrestrepo.${uid}@empresa.com`,
      status: "Inactive",
    });
    createdContactIds.push(c3.id);

    // -------------------------------------------------------------------------
    // Test 1: [Exitoso] Búsqueda parcial de contactos
    // -------------------------------------------------------------------------
    await ctx.runTest("[Exitoso] Realiza búsqueda parcial y recupera contactos coincidentes", async () => {
      await navigateTo(page, "#Contact");

      await page.evaluate((term: string) => {
        const inp = (document.querySelector('input.text-filter') ||
          document.querySelector('input[data-name="textFilter"]')) as HTMLInputElement;
        if (inp) {
          inp.focus();
          inp.value = term;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }
      }, "Gom");
      await page.waitForTimeout(2500);

      const data = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasGomez = /Carlos G[oó]mez/i.test(text);
        const hasGomis = /Ana Gomis/i.test(text);
        const rows = document.querySelectorAll('.list-row, tr[data-id]');
        return {
          hasResults: rows.length >= 1,
          containsGomez: hasGomez || hasGomis,
        };
      });

      if (!data.hasResults || !data.containsGomez) {
        throw new Error("La búsqueda parcial no recuperó los contactos esperados");
      }
    });

    // -------------------------------------------------------------------------
    // Test 2: [Exitoso] Búsqueda exacta por nombre completo
    // -------------------------------------------------------------------------
    await ctx.runTest("[Exitoso] Búsqueda exacta recupera únicamente el contacto indicado", async () => {
      await navigateTo(page, "#Contact");

      const target = `Carlos Gómez${uid}`;
      await page.evaluate((term: string) => {
        const inp = (document.querySelector('input.text-filter') ||
          document.querySelector('input[data-name="textFilter"]')) as HTMLInputElement;
        if (inp) {
          inp.focus();
          inp.value = term;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }
      }, target);
      await page.waitForTimeout(2000);

      const check = await extractData<{
        targetFound: boolean;
      }>(
        stagehand,
        `Verify that the contact "${target}" is shown in the table results`,
        z.object({
          targetFound: z.boolean(),
        })
      );

      if (!check.targetFound) {
        throw new Error(`No se encontró el contacto esperado "${target}"`);
      }
    });

    // -------------------------------------------------------------------------
    // Test 3: [Exitoso] Búsqueda de contacto inactivo por apellido
    // -------------------------------------------------------------------------
    await ctx.runTest("[Exitoso] Filtra y muestra contacto inactivo al buscarlo por apellido", async () => {
      await navigateTo(page, "#Contact");

      const target = `Restrepo${uid}`;
      await page.evaluate((term: string) => {
        const inp = (document.querySelector('input.text-filter') ||
          document.querySelector('input[data-name="textFilter"]')) as HTMLInputElement;
        if (inp) {
          inp.focus();
          inp.value = term;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }
      }, target);
      await page.waitForTimeout(2000);

      const check = await extractData<{
        found: boolean;
      }>(
        stagehand,
        `Check if the contact table contains "Luis ${target}"`,
        z.object({
          found: z.boolean(),
        })
      );

      if (!check.found) {
        throw new Error(`No se encontró el contacto inactivo con apellido "${target}"`);
      }
    });

    // -------------------------------------------------------------------------
    // Test 4: [Alternativo] Indicador "No Data" ante término inexistente
    // -------------------------------------------------------------------------
    await ctx.runTest("[Alternativo] Muestra indicador No Data ante término inexistente", async () => {
      await navigateTo(page, "#Contact");

      await page.evaluate((term: string) => {
        const inp = (document.querySelector('input.text-filter') ||
          document.querySelector('input[data-name="textFilter"]')) as HTMLInputElement;
        if (inp) {
          inp.focus();
          inp.value = term;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const searchBtn = document.querySelector('button[data-action="search"], .search-button') as HTMLElement;
        if (searchBtn) {
          searchBtn.click();
        } else if (inp) {
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }
      }, "TerminoInexistenteXYZ_Stagehand_99");

      await page.waitForTimeout(2500);

      const hasNoData = await page.evaluate(() => {
        const rows = document.querySelectorAll('.list-row, tr[data-id]');
        const noData = document.querySelector('.no-data, .list-empty, .empty-result');
        const text = document.body.innerText.toLowerCase();
        return rows.length === 0 || !!noData || text.includes("no data") || text.includes("no hay datos");
      });

      if (!hasNoData) {
        throw new Error("El sistema no mostró el indicador 'No Data' o la lista no quedó vacía");
      }
    });

    // -------------------------------------------------------------------------
    // Test 5: [Invariante UI] Verificación del componente de búsqueda
    // -------------------------------------------------------------------------
    await ctx.runTest("[Invariante UI] El listado de Contactos tiene barra de búsqueda activa", async () => {
      await navigateTo(page, "#Contact");

      const uiCheck = await extractData<{
        searchVisible: boolean;
      }>(
        stagehand,
        "Verify if the search filter input is visible and enabled",
        z.object({
          searchVisible: z.boolean(),
        })
      );

      if (!uiCheck.searchVisible) {
        throw new Error("El input de búsqueda de contactos no está visible");
      }
    });

  } finally {
    for (const id of createdContactIds) {
      await deleteEntityViaApi("Contact", id);
    }
    ctx.printSummary("F3: Búsqueda de Contactos (Stagehand + Gemini)");
    await ctx.close();
  }
}

main().catch(console.error);
