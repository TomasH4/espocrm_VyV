/**
 * stagehand.config.ts
 *
 * Configuración centralizada de Stagehand con Google Gemini para VyV EspoCRM.
 */

import dotenv from "dotenv";
dotenv.config();

export const config = {
  env: "LOCAL" as const,
  modelName: (process.env.GEMINI_MODEL || "google/gemini-3.1-flash-lite") as `google/${string}`,
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  baseUrl: process.env.ESPOCRM_URL || "http://localhost:8080",
  user: process.env.ESPOCRM_USER || "Tomas",
  pass: process.env.ESPOCRM_PASS || "tomas12345",
  headless: process.env.HEADLESS !== "false",
};

