# Suite de Pruebas BDD con Gherkin y Patrón Screenplay

Esta carpeta contiene la implementación completa de pruebas **E2E con BDD (Behavior-Driven Development)** utilizando **lenguaje Gherkin** y el patrón de diseño **Screenplay**, separada e independiente de las pruebas tradicionales de Cypress (`cypress/e2e/`).

---

## 1. Estructura del Proyecto

```
tests_bdd_screenplay/
├── features/                  # Escenarios de negocio en lenguaje Gherkin (.feature)
│   ├── F1_lead_creation.feature
│   ├── F2_opportunity_probability.feature
│   ├── F3_contact_search.feature
│   ├── F4_meeting_scheduling.feature
│   └── F5_lead_conversion.feature
│
├── step_definitions/          # Mapeo de pasos Dado - Cuando - Entonces
│   ├── F1_lead_creation.steps.js
│   ├── F2_opportunity_probability.steps.js
│   ├── F3_contact_search.steps.js
│   ├── F4_meeting_scheduling.steps.js
│   └── F5_lead_conversion.steps.js
│
└── screenplay/                # Capas de Arquitectura Screenplay
    ├── actor/
    │   └── Actor.js           # Entidad Actor (Tomas), memoria y ejecución de tareas
    ├── abilities/
    │   ├── BrowseTheWeb.js    # Habilidad de navegar y manipular la interfaz web
    │   └── CallAnApi.js       # Habilidad de invocar la API REST
    ├── interactions/
    │   └── Interactions.js    # Acciones atómicas UI: Click, Fill, TypeField, SelectOption, CheckScope
    ├── tasks/
    │   └── Tasks.js           # Tareas de negocio: Login, CreateLead, CreateOpportunity, etc.
    └── questions/
        └── Questions.js       # Consultas sobre el estado del DOM: CurrentUrl, PageHeader, ContactList
```

---

## 2. Comandos de Ejecución

Desde la raíz de `espocrm_VyV`:

### Ejecutar una funcionalidad específica:
```powershell
# F1: Creación de Leads
npx cypress run --spec "tests_bdd_screenplay/features/F1_lead_creation.feature" --browser chrome

# F2: Cálculo de Probabilidad de Oportunidades
npx cypress run --spec "tests_bdd_screenplay/features/F2_opportunity_probability.feature" --browser chrome

# F3: Búsqueda y Filtrado de Contactos
npx cypress run --spec "tests_bdd_screenplay/features/F3_contact_search.feature" --browser chrome

# F4: Programación y Validación Temporal de Reuniones
npx cypress run --spec "tests_bdd_screenplay/features/F4_meeting_scheduling.feature" --browser chrome

# F5: Conversión Transaccional de Leads
npx cypress run --spec "tests_bdd_screenplay/features/F5_lead_conversion.feature" --browser chrome
```

### Ejecutar todas las pruebas BDD de Screenplay:
```powershell
npx cypress run --spec "tests_bdd_screenplay/features/*.feature" --browser chrome
```

