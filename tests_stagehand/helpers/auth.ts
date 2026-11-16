/**
 * helpers/auth.ts
 *
 * Helper de autenticación en EspoCRM.
 * Usa interacción directa en el DOM para ahorrar llamadas a la API de Gemini
 * y no agotar el límite de 15 RPM del free tier.
 */

import { config } from "../stagehand.config.js";

export async function loginToEspoCRM(page: any, stagehand: any): Promise<void> {
  console.log(`[Auth] Navegando a ${config.baseUrl}...`);
  await page.goto(config.baseUrl);
  await page.waitForTimeout(1500);

  // Verificar si se encuentra en pantalla de inicio de sesión o si ya está autenticado
  let isLoginPage = await page.evaluate(() => !!document.querySelector("#field-userName"));

  if (!isLoginPage) {
    const start = Date.now();
    while (Date.now() - start < 10000) {
      const state = await page.evaluate(() => ({
        hasLogin: !!document.querySelector("#field-userName"),
        hasNavbar: !!document.querySelector("#navbar") || !!document.querySelector(".navbar"),
      }));
      if (state.hasLogin) {
        isLoginPage = true;
        break;
      }
      if (state.hasNavbar) {
        console.log("[Auth] Sesión ya activa en navegador.");
        return;
      }
      await page.waitForTimeout(400);
    }
  }

  if (isLoginPage) {
    console.log(`[Auth] Iniciando sesión como ${config.user}...`);

    await page.locator("#field-userName").fill(config.user);
    await page.locator("#field-password").fill(config.pass);
    await page.waitForTimeout(200);

    await page.locator("#btn-login").click();

    // Esperar a que la sesión cargue y aparezca el navbar
    const start = Date.now();
    let loggedIn = false;
    while (Date.now() - start < 20000) {
      loggedIn = await page.evaluate(() => {
        return !!document.querySelector("#navbar") || !!document.querySelector(".navbar") || !!document.querySelector("#main");
      });
      if (loggedIn) break;
      await page.waitForTimeout(500);
    }

    if (!loggedIn) {
      throw new Error("Timeout esperando navbar de EspoCRM tras iniciar sesión");
    }

    await page.waitForTimeout(1000);
    console.log("[Auth] Sesión iniciada con éxito.");
  } else {
    console.log("[Auth] Sesión ya activa en navegador.");
  }
}
