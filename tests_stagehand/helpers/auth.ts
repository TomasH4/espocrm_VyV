/**
 * helpers/auth.ts
 *
 * Helper de autenticación en EspoCRM.
 * Usa interacción directa en el DOM para ahorrar llamadas a la API de Gemini
 * y no agotar el límite de 15 RPM del free tier.
 */

import { config } from "../stagehand.config.js";

export async function loginToEspoCRM(page: any, stagehand: any): Promise<void> {
  await page.goto(config.baseUrl);
  await page.waitForTimeout(1000);

  // Verificar si se encuentra en pantalla de inicio de sesión
  const isLoginPage = await page.evaluate(() => {
    return !!document.querySelector("#field-userName");
  });

  if (isLoginPage) {
    console.log(`[Auth] Iniciando sesión como ${config.user}...`);

    await page.evaluate(
      ({ user, pass }: { user: string; pass: string }) => {
        const userInput = document.querySelector("#field-userName") as HTMLInputElement;
        const passInput = document.querySelector("#field-password") as HTMLInputElement;
        const btn = document.querySelector("#btn-login") as HTMLElement;

        if (userInput) {
          userInput.value = user;
          userInput.dispatchEvent(new Event("input", { bubbles: true }));
          userInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (passInput) {
          passInput.value = pass;
          passInput.dispatchEvent(new Event("input", { bubbles: true }));
          passInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (btn) {
          btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        }
      },
      { user: config.user, pass: config.pass }
    );

    // Esperar a que la barra principal o el contenedor principal sea visible
    await page.waitForSelector("#main, .navbar, .header-toolbar", { timeout: 15000 });
    console.log("[Auth] Sesión iniciada con éxito.");
  }
}
