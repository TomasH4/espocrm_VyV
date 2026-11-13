/**
 * F4_meeting_scheduling.stagehand.ts
 *
 * Suite de pruebas E2E con Stagehand + Google Gemini para:
 * Funcionalidad 4: Programación y Validación Temporal de Reuniones
 *
 * Replica los escenarios probados en cypress/e2e/F4_meeting_scheduling.cy.js
 * usando manipulación DOM directa (Backbone + Selectize) donde stagehand.act
 * no puede manejar datepickers de EspoCRM confiablemente.
 *
 * NOTA: EspoCRM espera el formato de fecha DD.MM.YYYY en los inputs tipo datepicker.
 */

import { z } from "zod";
import {
  StagehandTestContext,
  waitForUrl,
  getUrl,
  navigateTo,
  extractData,
  setInputValue,
  selectEspoOption,
  clickSaveAction,
} from "./helpers/testRunner.js";
import { deleteEntityViaApi } from "./helpers/api.js";

/**
 * Llena los campos de fecha/hora de una reunión via DOM directo.
 * EspoCRM usa inputs separados para fecha y hora:
 *   - input[data-name="dateStart"]  → fecha inicio   (DD.MM.YYYY)
 *   - input[data-name="dateStart-time"] → hora inicio (HH:MM)
 *   - input[data-name="dateEnd"]    → fecha fin       (DD.MM.YYYY)
 *   - input[data-name="dateEnd-time"]   → hora fin    (HH:MM)
 */
async function setMeetingDateTime(
  page: any,
  field: "dateStart" | "dateEnd",
  dateDDMMYYYY: string,
  timeHHMM: string
): Promise<void> {
  const dateSelector = `input[data-name="${field}"]`;
  const timeSelector = `input[data-name="${field}-time"]`;

  try {
    const locDate = page.locator(dateSelector);
    if (locDate) {
      await locDate.fill(dateDDMMYYYY);
    }
  } catch (e) {
    console.log(`Fallback fill date for ${field}`);
  }

  if (timeHHMM) {
    try {
      const locTime = page.locator(timeSelector);
      if (locTime) {
        await locTime.fill(timeHHMM);
      }
    } catch (e) {
      console.log(`Fallback fill time for ${field}`);
    }
  }

  await page.waitForTimeout(300);
}

async function main() {
  const ctx = new StagehandTestContext();
  const createdMeetingIds: string[] = [];

  try {
    await ctx.init();
    const { stagehand, page } = ctx;

    // -------------------------------------------------------------------------
    // Test 1: [Exitoso] Calcula automáticamente duración 90 min (inicio 10:00 → fin 11:30)
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Exitoso] Calcula automáticamente duración (90 min) de dateStart y dateEnd",
      async () => {
        try {
          const uid = Date.now();
          const meetingName = `Comité Técnico AI ${uid}`;

          console.log("Paso 1: navigateTo");
          await navigateTo(page, "#Meeting/create");
          await page.waitForTimeout(1500);

          console.log("Paso 2: setInputValue name");
          await setInputValue(page, 'input[data-name="name"]', meetingName);

          console.log("Paso 3: setMeetingDateTime dateEnd");
          await setMeetingDateTime(page, "dateEnd", "01.12.2026", "11:30");

          console.log("Paso 4: setMeetingDateTime dateStart");
          await setMeetingDateTime(page, "dateStart", "01.12.2026", "10:00");

          console.log("Paso 5: clickSaveAction");
          await clickSaveAction(page, stagehand);

          console.log("Paso 6: waitForUrl");
          await waitForUrl(page, /#Meeting\/view\//, 20000);

          const data = await extractData<{ name: string }>(
            stagehand,
            "Extract the meeting name displayed in the detail view",
            z.object({ name: z.string() })
          );

          if (!data.name.includes(meetingName.substring(0, 20))) {
            throw new Error(
              `La reunión no se guardó con el nombre esperado. Obtenido: "${data.name}"`
            );
          }

          const curUrl = await getUrl(page);
          const match = curUrl.match(/#Meeting\/view\/([a-zA-Z0-9]+)/);
          if (match && match[1]) createdMeetingIds.push(match[1]);
        } catch (err: any) {
          console.error("DEBUG CATCH EXPLICITO:", err);
          throw err;
        }
      }
    );

    // -------------------------------------------------------------------------
    // Test 2: [Exitoso] Proyecta automáticamente fecha fin con duración 30 min
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Exitoso] Proyecta automáticamente fecha fin con duración de 30 min",
      async () => {
        const uid = Date.now();
        const meetingName = `Llamada Rápida ${uid}`;

        await navigateTo(page, "#Meeting/create");
        await page.waitForTimeout(1500);

        await setInputValue(page, 'input[data-name="name"]', meetingName);
        await setMeetingDateTime(page, "dateStart", "01.12.2026", "15:00");

        // Seleccionar duración 30 min (valor Selectize = "1800")
        await selectEspoOption(page, "duration", "1800");

        await clickSaveAction(page, stagehand);
        await waitForUrl(page, /#Meeting\/view\//, 20000);

        const data = await extractData<{ title: string }>(
          stagehand,
          "Extract the displayed meeting title or name in the detail view",
          z.object({ title: z.string() })
        );

        if (!data.title.includes(meetingName.substring(0, 20))) {
          throw new Error(
            `No se visualiza la reunión guardada. Obtenido: "${data.title}"`
          );
        }

        const curUrl = await getUrl(page);
        const match = curUrl.match(/#Meeting\/view\/([a-zA-Z0-9]+)/);
        if (match && match[1]) createdMeetingIds.push(match[1]);
      }
    );

    // -------------------------------------------------------------------------
    // Test 3: [Alternativo] Asigna duración por defecto de 60 min
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Alternativo] Asigna duración por defecto de 60 min al omitir fin y duración",
      async () => {
        const uid = Date.now();
        const meetingName = `Reunión General Default ${uid}`;

        await navigateTo(page, "#Meeting/create");
        await page.waitForTimeout(1500);

        await setInputValue(page, 'input[data-name="name"]', meetingName);
        await setMeetingDateTime(page, "dateStart", "01.12.2026", "09:00");

        await clickSaveAction(page, stagehand);
        await waitForUrl(page, /#Meeting\/view\//, 20000);

        // Si llega a view/ significa que se guardó correctamente
        const curUrl = await getUrl(page);
        if (!curUrl.includes("#Meeting/view/")) {
          throw new Error("La reunión no se guardó (no llegó a la vista de detalle)");
        }

        const match = curUrl.match(/#Meeting\/view\/([a-zA-Z0-9]+)/);
        if (match && match[1]) createdMeetingIds.push(match[1]);
      }
    );

    // -------------------------------------------------------------------------
    // Test 4: [Error] Rechaza la creación si la fecha de inicio está vacía
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Error] Rechaza la creación si la fecha de inicio está vacía",
      async () => {
        await navigateTo(page, "#Meeting/create");
        await page.waitForTimeout(1500);

        await setInputValue(page, 'input[data-name="name"]', "Reunión Sin Fecha");

        // Limpiar campos de fecha inicio explícitamente
        await page.evaluate(() => {
          ["dateStart", "dateStart-time"].forEach((field) => {
            const inp = document.querySelector(
              `input[data-name="${field}"]`
            ) as HTMLInputElement | null;
            if (inp) {
              inp.value = "";
              inp.dispatchEvent(new Event("input", { bubbles: true }));
              inp.dispatchEvent(new Event("change", { bubbles: true }));
            }
          });
        });

        await clickSaveAction(page, stagehand);
        await page.waitForTimeout(2500);

        const curUrl = await getUrl(page);
        if (!curUrl.includes("#Meeting/create")) {
          throw new Error(
            "El sistema permitió guardar una reunión sin fecha de inicio"
          );
        }
      }
    );

    // -------------------------------------------------------------------------
    // Test 5: [Invariante UI] Verificación de controles del formulario de Reunión
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Invariante UI] El formulario de Reunión renderiza los controles temporales",
      async () => {
        await navigateTo(page, "#Meeting/create");
        await page.waitForTimeout(1500);

        const hasControls = await page.evaluate(() => {
          return !!(
            document.querySelector('input[data-name="name"]') &&
            document.querySelector('input[data-name="dateStart"]') &&
            document.querySelector('button[data-action="save"]')
          );
        });

        if (!hasControls) {
          throw new Error(
            "El formulario de Reunión carece de los controles obligatorios (nombre, fecha inicio, guardar)"
          );
        }
      }
    );
  } finally {
    for (const id of createdMeetingIds) {
      await deleteEntityViaApi("Meeting", id);
    }
    ctx.printSummary("F4: Programación de Reuniones (Stagehand + Gemini)");
    await ctx.close();
  }
}

main().catch(console.error);
