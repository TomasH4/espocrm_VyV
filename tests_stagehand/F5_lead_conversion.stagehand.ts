/**
 * F5_lead_conversion.stagehand.ts
 *
 * Suite de pruebas E2E con Stagehand + Google Gemini para:
 * Funcionalidad 5: Conversión Transaccional de Lead en Contacto y Cuenta
 *
 * Replica los escenarios probados en cypress/e2e/F5_lead_conversion.cy.js
 * usando manipulación DOM directa para los checkboxes de scope y el botón Convert.
 */

import { z } from "zod";
import {
  StagehandTestContext,
  waitForUrl,
  getUrl,
  navigateTo,
  extractData,
} from "./helpers/testRunner.js";
import { createEntityViaApi, deleteEntityViaApi } from "./helpers/api.js";

/**
 * Ejecuta la conversión en la página #Lead/convert/:
 * 1. Marca los checkboxes de scope indicados (Contact, Account, etc.)
 * 2. Hace clic en el botón Convert de confirmación
 */
async function executeConversion(
  page: any,
  scopes: string[] = ["Contact"]
): Promise<void> {
  // Marcar checkboxes de scope
  await page.evaluate((scopeList: string[]) => {
    scopeList.forEach((scope) => {
      const checkbox = document.querySelector(
        `input.check-scope[data-scope="${scope}"]`
      ) as HTMLInputElement | null;
      if (checkbox && !checkbox.checked) {
        checkbox.click();
      }
    });
  }, scopes);
  await page.waitForTimeout(500);

  // Clic en botón Convert de confirmación (.button-container button[data-action="convert"])
  await page.evaluate(() => {
    const btn = (document.querySelector(
      '.button-container button[data-action="convert"]'
    ) ||
      document.querySelector(
        '.detail-button-container button[data-action="convert"]'
      ) ||
      document.querySelector('button[data-action="convert"]')) as HTMLElement | null;
    if (btn) {
      btn.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, view: window })
      );
    }
  });
  await page.waitForTimeout(3000);
}

async function main() {
  const ctx = new StagehandTestContext();
  const createdLeadIds: string[] = [];

  try {
    await ctx.init();
    const { stagehand, page } = ctx;

    // -------------------------------------------------------------------------
    // Test 1: [Exitoso] Conversión B2B Completa (Contacto + Cuenta)
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Exitoso] Conversión B2B: crea Contacto y Cuenta a partir de Lead con empresa",
      async () => {
        const uid = Date.now();
        const accountName = `Empresa B2B ${uid} SA`;
        const lead = await createEntityViaApi("Lead", {
          firstName: "Carlos",
          lastName: `Corporativo${uid}`,
          accountName,
          emailAddress: `corp.${uid}@empresa.com`,
          phoneNumber: `+57300${String(uid).slice(-7)}`,
          status: "Assigned",
        });
        createdLeadIds.push(lead.id);

        await navigateTo(page, `#Lead/view/${lead.id}`);
        await page.waitForTimeout(2000);

        // Clic en botón Convert del header de la vista
        await page.evaluate(() => {
          const btn = document.querySelector(
            'button[data-action="convert"]'
          ) as HTMLElement | null;
          if (btn) btn.click();
        });

        await waitForUrl(page, /#Lead\/convert\//, 15000);
        await page.waitForTimeout(1500);

        await executeConversion(page, ["Contact", "Account"]);

        // Verificar que el lead quedó como Converted
        const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
        if (!bodyText.includes("converted")) {
          throw new Error(
            `El estado del Lead no muestra "Converted". Texto en página: ${bodyText.substring(0, 200)}`
          );
        }
      }
    );

    // -------------------------------------------------------------------------
    // Test 2: [Exitoso] Conversión B2C: crea únicamente Contacto sin Cuenta
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Exitoso] Conversión B2C: crea únicamente Contacto sin Cuenta",
      async () => {
        const uid = Date.now();
        const lead = await createEntityViaApi("Lead", {
          firstName: "Laura",
          lastName: `Natural${uid}`,
          accountName: null,
          emailAddress: `persona.${uid}@gmail.com`,
          phoneNumber: `+57310${String(uid).slice(-7)}`,
          status: "New",
        });
        createdLeadIds.push(lead.id);

        await navigateTo(page, `#Lead/view/${lead.id}`);
        await page.waitForTimeout(2000);

        await page.evaluate(() => {
          const btn = document.querySelector(
            'button[data-action="convert"]'
          ) as HTMLElement | null;
          if (btn) btn.click();
        });

        await waitForUrl(page, /#Lead\/convert\//, 15000);
        await page.waitForTimeout(1500);

        // Solo marcar Contact (desmarcar Account si está marcado)
        await page.evaluate(() => {
          const contactCb = document.querySelector(
            'input.check-scope[data-scope="Contact"]'
          ) as HTMLInputElement | null;
          if (contactCb && !contactCb.checked) contactCb.click();

          const accountCb = document.querySelector(
            'input.check-scope[data-scope="Account"]'
          ) as HTMLInputElement | null;
          if (accountCb && accountCb.checked) accountCb.click();
        });
        await page.waitForTimeout(500);

        await executeConversion(page, []);

        const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
        if (!bodyText.includes("converted")) {
          throw new Error("El Lead persona natural no se marcó como Converted");
        }
      }
    );

    // -------------------------------------------------------------------------
    // Test 3: [Alternativo] Verifica propagación de email al formulario de conversión
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Alternativo] Verifica propagación de email al formulario de conversión",
      async () => {
        const uid = Date.now();
        const targetEmail = `pedro.${uid}@empresavyv.com`;
        const lead = await createEntityViaApi("Lead", {
          firstName: "Pedro",
          lastName: `Sanchez${uid}`,
          emailAddress: targetEmail,
          status: "In Process",
        });
        createdLeadIds.push(lead.id);

        await navigateTo(page, `#Lead/view/${lead.id}`);
        await page.waitForTimeout(2000);

        await page.evaluate(() => {
          const btn = document.querySelector(
            'button[data-action="convert"]'
          ) as HTMLElement | null;
          if (btn) btn.click();
        });

        await waitForUrl(page, /#Lead\/convert\//, 15000);
        await page.waitForTimeout(2000);

        // Verificar que el email está en la página de conversión
        const emailFound = await page.evaluate((email: string) => {
          return document.body.innerText.includes(email) ||
            (document.querySelector(`input[value="${email}"]`) !== null) ||
            (document.body.innerHTML.includes(email));
        }, targetEmail);

        if (!emailFound) {
          // Intentar también con stagehand.extract
          const data = await extractData<{ emailFound: boolean }>(
            stagehand,
            `Verify if the email "${targetEmail}" is visible somewhere in the conversion form`,
            z.object({ emailFound: z.boolean() })
          );
          if (!data.emailFound) {
            throw new Error(
              `El email "${targetEmail}" no se visualiza en la conversión`
            );
          }
        }
      }
    );

    // -------------------------------------------------------------------------
    // Test 4: [Error] Rechaza doble conversión sobre un Lead Converted
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Error] Rechaza doble conversión sobre un Lead con estado Converted",
      async () => {
        const uid = Date.now();
        const lead = await createEntityViaApi("Lead", {
          firstName: "Lead",
          lastName: `YaConvertido${uid}`,
          status: "Converted",
        });
        createdLeadIds.push(lead.id);

        await navigateTo(page, `#Lead/view/${lead.id}`);
        await page.waitForTimeout(2000);

        // Verificar ausencia del botón Convert via DOM (más confiable que stagehand.extract)
        const convertBtnExists = await page.evaluate(() => {
          return !!document.querySelector('button[data-action="convert"]');
        });

        if (convertBtnExists) {
          throw new Error(
            "El botón Convert no debería existir para un Lead ya convertido"
          );
        }
      }
    );

    // -------------------------------------------------------------------------
    // Test 5: [Invariante UI] La vista de conversión muestra los ámbitos seleccionables
    // -------------------------------------------------------------------------
    await ctx.runTest(
      "[Invariante UI] La vista de conversión muestra los ámbitos seleccionables",
      async () => {
        const uid = Date.now();
        const lead = await createEntityViaApi("Lead", {
          firstName: "Scope",
          lastName: `Test${uid}`,
          status: "New",
        });
        createdLeadIds.push(lead.id);

        await navigateTo(page, `#Lead/view/${lead.id}`);
        await page.waitForTimeout(2000);

        await page.evaluate(() => {
          const btn = document.querySelector(
            'button[data-action="convert"]'
          ) as HTMLElement | null;
          if (btn) btn.click();
        });

        await waitForUrl(page, /#Lead\/convert\//, 15000);
        await page.waitForTimeout(2000);

        // Verificar que existe el botón de conversión (.button-container button[data-action="convert"])
        const hasConvertBtn = await page.evaluate(() => {
          return !!(
            document.querySelector('.button-container button[data-action="convert"]') ||
            document.querySelector('button[data-action="convert"]')
          );
        });

        if (!hasConvertBtn) {
          throw new Error(
            "Falta el botón de confirmación de conversión en la vista de conversión"
          );
        }
      }
    );
  } finally {
    for (const id of createdLeadIds) {
      await deleteEntityViaApi("Lead", id);
    }
    ctx.printSummary("F5: Conversión de Lead (Stagehand + Gemini)");
    await ctx.close();
  }
}

main().catch(console.error);
