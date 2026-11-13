/**
 * F2_opportunity_probability.stagehand.ts
 *
 * Suite de pruebas E2E con Stagehand + Google Gemini para:
 * Funcionalidad 2: Cálculo Automático de Probabilidad en Oportunidades
 *
 * Replica los escenarios de cypress/e2e/F2_opportunity_probability.cy.js:
 *  - Prospecting -> 10%
 *  - Closed Won -> 100%
 *  - Closed Lost -> 0%
 *  - Proposal (transición) -> 50%
 *  - Renderizado de campos clave en UI
 */

import { z } from "zod";
import {
  StagehandTestContext,
  waitForUrl,
  getUrl,
  navigateTo,
  extractData,
  clickSaveAction,
  selectEspoOption,
  setInputValue,
} from "./helpers/testRunner.js";
import { createEntityViaApi, deleteEntityViaApi } from "./helpers/api.js";

async function fillOpportunityForm(
  page: any,
  opts: { name: string; amount: string; closeDate?: string; stage: string }
): Promise<void> {
  // 1. Seleccionar etapa vía Selectize (actualiza el modelo Backbone)
  await selectEspoOption(page, "stage", opts.stage);

  // 2. Asignar nombre
  await setInputValue(page, 'input[data-name="name"]', opts.name);

  // 3. Asignar monto numérico (sin disparar blur destructivo)
  await setInputValue(page, 'input[data-name="amount"]', opts.amount);

  // 4. Asignar fecha de cierre en formato DD.MM.YYYY esperado por EspoCRM
  await setInputValue(page, 'input[data-name="closeDate"]', opts.closeDate || "31.12.2026");
}

async function main() {
  const ctx = new StagehandTestContext();
  const createdOpportunityIds: string[] = [];

  try {
    await ctx.init();
    const { stagehand, page } = ctx;

    // -------------------------------------------------------------------------
    // Test 1: [Exitoso] Asigna automáticamente 10% de probabilidad para Prospecting
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Exitoso] Asigna automáticamente 10% de probabilidad para la etapa Prospecting",
      async () => {
        const uid = Date.now();
        const optName = `Opt_Prospecting_${uid}`;

        await navigateTo(page, "#Opportunity/create");
        await fillOpportunityForm(page, {
          name: optName,
          amount: "10000",
          closeDate: "31.12.2026",
          stage: "Prospecting",
        });

        await clickSaveAction(page, stagehand);
        await waitForUrl(page, /#Opportunity\/view\//, 20000);

        const data = await extractData<{ probability: string; stage: string }>(
          stagehand,
          "Extract the probability percentage value and current stage name from the opportunity detail view",
          z.object({
            probability: z.string(),
            stage: z.string(),
          })
        );

        if (!data.probability.includes("10")) {
          throw new Error(`La probabilidad esperada era 10%, se obtuvo: "${data.probability}"`);
        }

        const curUrl = await getUrl(page);
        const match = curUrl.match(/#Opportunity\/view\/([a-zA-Z0-9]+)/);
        if (match?.[1]) createdOpportunityIds.push(match[1]);
      }
    );

    // -------------------------------------------------------------------------
    // Test 2: [Exitoso] Asigna automáticamente 100% de probabilidad para Closed Won
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Exitoso] Asigna automáticamente 100% de probabilidad para la etapa Closed Won",
      async () => {
        const uid = Date.now();
        const optName = `Opt_Won_${uid}`;

        await navigateTo(page, "#Opportunity/create");
        await fillOpportunityForm(page, {
          name: optName,
          amount: "20000",
          closeDate: "31.12.2026",
          stage: "Closed Won",
        });

        await clickSaveAction(page, stagehand);
        await waitForUrl(page, /#Opportunity\/view\//, 20000);

        const data = await extractData<{ probability: string }>(
          stagehand,
          "Extract the displayed probability percentage number from the opportunity detail view",
          z.object({
            probability: z.string(),
          })
        );

        if (!data.probability.includes("100")) {
          throw new Error(`La probabilidad esperada era 100%, se obtuvo: "${data.probability}"`);
        }

        const curUrl = await getUrl(page);
        const match = curUrl.match(/#Opportunity\/view\/([a-zA-Z0-9]+)/);
        if (match?.[1]) createdOpportunityIds.push(match[1]);
      }
    );

    // -------------------------------------------------------------------------
    // Test 3: [Exitoso] Asigna automáticamente 0% de probabilidad para Closed Lost
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Exitoso] Asigna automáticamente 0% de probabilidad para la etapa Closed Lost",
      async () => {
        const uid = Date.now();
        const optName = `Opt_Lost_${uid}`;

        await navigateTo(page, "#Opportunity/create");
        await fillOpportunityForm(page, {
          name: optName,
          amount: "5000",
          closeDate: "31.12.2026",
          stage: "Closed Lost",
        });

        await clickSaveAction(page, stagehand);
        await waitForUrl(page, /#Opportunity\/view\//, 20000);

        const data = await extractData<{ probability: string }>(
          stagehand,
          "Extract the probability percentage value from the opportunity detail view",
          z.object({
            probability: z.string(),
          })
        );

        if (!data.probability.includes("0")) {
          throw new Error(`La probabilidad esperada era 0%, se obtuvo: "${data.probability}"`);
        }

        const curUrl = await getUrl(page);
        const match = curUrl.match(/#Opportunity\/view\/([a-zA-Z0-9]+)/);
        if (match?.[1]) createdOpportunityIds.push(match[1]);
      }
    );

    // -------------------------------------------------------------------------
    // Test 4: [Alternativo] Recalcula dinámicamente de 10% a 50% al actualizar a Proposal
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Alternativo] Recalcula dinámicamente de 10% a 50% al actualizar a Proposal",
      async () => {
        const uid = Date.now();
        const opt = (await createEntityViaApi("Opportunity", {
          name: `Opt_Transition_${uid}`,
          stage: "Prospecting",
          amount: 15000,
          closeDate: "2026-12-31",
          probability: 10,
        })) as any;
        createdOpportunityIds.push(opt.id);

        await navigateTo(page, `#Opportunity/edit/${opt.id}`);
        await page.waitForTimeout(1500);

        // Actualizar etapa a Proposal vía Selectize
        await selectEspoOption(page, "stage", "Proposal");

        await clickSaveAction(page, stagehand);
        await waitForUrl(page, /#Opportunity\/view\//, 20000);

        const data = await extractData<{ probability: string }>(
          stagehand,
          "Extract the probability percentage value displayed on this opportunity view",
          z.object({
            probability: z.string(),
          })
        );

        if (!data.probability.includes("50")) {
          throw new Error(`La probabilidad esperada era 50%, se obtuvo: "${data.probability}"`);
        }
      }
    );

    // -------------------------------------------------------------------------
    // Test 5: [Invariante UI] El formulario de Oportunidad renderiza los campos requeridos
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Invariante UI] El formulario de Oportunidad renderiza los campos requeridos",
      async () => {
        await navigateTo(page, "#Opportunity/create");

        const check = await page.evaluate(() => {
          const hasName = !!document.querySelector('input[data-name="name"]');
          const hasStage = !!document.querySelector('select[data-name="stage"]');
          const hasAmount = !!document.querySelector('input[data-name="amount"]');
          const hasCloseDate = !!document.querySelector('input[data-name="closeDate"]');
          const hasSave = !!document.querySelector('button[data-action="save"]');
          return hasName && hasStage && hasAmount && hasCloseDate && hasSave;
        });

        if (!check) {
          throw new Error("El formulario de Oportunidad no renderiza todos los campos requeridos");
        }
      }
    );
  } finally {
    for (const id of createdOpportunityIds) {
      await deleteEntityViaApi("Opportunity", id).catch(() => {});
    }
    ctx.printSummary("F2: Probabilidad en Oportunidades (Stagehand + Gemini)");
    await ctx.close();
  }
}

main().catch(console.error);
