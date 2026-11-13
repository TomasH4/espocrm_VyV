/**
 * helpers/api.ts
 *
 * Funciones de soporte API para inicialización rápida y limpieza estricta (FIRST).
 */

import { config } from "../stagehand.config.js";

function getAuthHeader(): string {
  return "Basic " + Buffer.from(`${config.user}:${config.pass}`).toString("base64");
}

export async function createEntityViaApi(entity: string, payload: Record<string, any>): Promise<any> {
  const response = await fetch(`${config.baseUrl}/api/v1/${entity}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error API creando ${entity}: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

export async function deleteEntityViaApi(entity: string, id: string): Promise<void> {
  if (!id) return;
  try {
    await fetch(`${config.baseUrl}/api/v1/${entity}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: getAuthHeader(),
      },
    });
  } catch (err) {
    console.warn(`[Cleanup] Error eliminando ${entity}/${id}:`, err);
  }
}

