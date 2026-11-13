# 🤖 Suite de Pruebas E2E con Stagehand + Google Gemini
## Plataforma: VyV EspoCRM

Implementación de pruebas E2E autónomas impulsadas por IA utilizando **Stagehand** (Browserbase) y **Google Gemini** (`google/gemini-2.0-flash`), replicando la cobertura de las 5 funcionalidades probadas originalmente en Cypress.

---

## 🎯 ¿Qué es Stagehand y cómo se diferencia de Cypress?

| Criterio | Pruebas Cypress Tradicionales (`cypress/e2e/`) | Pruebas Stagehand + Gemini (`tests_stagehand/`) |
|---|---|---|
| **Paradigma** | Selectores CSS y XPATH explícitos (`cy.get('input[data-name="firstName"]')`) | **Instrucciones en Lenguaje Natural** (`stagehand.act('Type Carlos into first name')`) |
| **Resiliencia ante Cambios de UI** | Frágil: si el desarrollador cambia `data-name` o la clase CSS, el test se rompe. | **Alta Resiliencia:** El modelo Gemini observa el DOM visualmente e infiere el campo correcto sin importar cambios de clases o IDs. |
| **Validaciones de Contenido** | Aserciones rígidas de cadenas (`.should('contain.text', ...)`) | **Extracción Semántica con Esquemas Zod** (`stagehand.extract(..., z.object({ ... }))`) |
| **Motor de Ejecución** | Runner propietario de Cypress | Playwright Core + Google Gemini |

---

## 📁 Estructura del Directorio `tests_stagehand/`

```
tests_stagehand/
├── package.json                          # Dependencias: Stagehand, Zod, TSX, Dotenv
├── .env.example                          # Plantilla de variables de entorno (API Key de Gemini)
├── .env                                  # Archivo de configuración activo con tu API Key
├── stagehand.config.ts                   # Configuración del modelo y navegador
├── helpers/
│   ├── auth.ts                           # Login autónomo en EspoCRM con lenguaje natural
│   ├── api.ts                            # Inicialización y limpieza de datos vía REST API
│   └── testRunner.ts                     # Contexto de ejecución, aserciones y reporte visual
├── F1_lead_creation.stagehand.ts         # 5 tests: Creación de Lead (Exitoso, Alternativo, Errores)
├── F2_opportunity_probability.stagehand.ts # 5 tests: Probabilidad comercial (Prospecting, Won, Lost, Proposal)
├── F3_contact_search.stagehand.ts        # 5 tests: Búsqueda parcial, exacta, filtros y No Data
├── F4_meeting_scheduling.stagehand.ts    # 5 tests: Duración 90m, proyección 30m, default 60m, validaciones
├── F5_lead_conversion.stagehand.ts       # 5 tests: Conversión B2B, B2C, propagación y prevención doble conversión
└── run_all_stagehand.ts                  # Runner maestro consolidado de toda la suite
```

---

## ⚙️ Configuración Previa

1. **Obtener una API Key de Google Gemini:**
   * Crea una clave gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey).
2. **Configurar tu clave en el archivo `.env`:**
   Abre el archivo `tests_stagehand/.env` y define tu clave:
   ```env
   GEMINI_API_KEY=AIzaSy...tu_clave_aqui...
   ```
   *(También es compatible si la defines como variable de entorno del sistema `GEMINI_API_KEY` o `GOOGLE_API_KEY`).*

---

## 🚀 Cómo Ejecutar las Pruebas

Desde una terminal en el directorio `espocrm_VyV\tests_stagehand`:

```bash
# Cambiar al directorio de Stagehand
cd c:\Users\sqluser\Desktop\VyV\espocrm_VyV\tests_stagehand

# 1. Ejecutar toda la suite completa (las 5 funcionalidades):
npm run test:all
# o directamente:
npx tsx run_all_stagehand.ts

# 2. Ejecutar por funcionalidad individual:
npm run test:lead          # F1: Creación de Lead
npm run test:opportunity   # F2: Probabilidad en Oportunidades
npm run test:contact       # F3: Búsqueda de Contactos
npm run test:meeting       # F4: Programación de Reuniones
npm run test:conversion    # F5: Conversión de Lead
```

### Ejecutar con navegador visible (modo headed):
Si deseas ver cómo Gemini opera el navegador en tiempo real, puedes anteponer `HEADLESS=false`:
```powershell
$env:HEADLESS="false"; npx tsx F1_lead_creation.stagehand.ts
```

