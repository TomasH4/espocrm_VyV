# 🧪 Cómo ejecutar las Pruebas de Regresión

## Suite completa (25 tests — R1 a R5)
```bash
npx cypress run --spec "cypress/e2e/regression/**/*.cy.js" --browser chrome
```

## Por funcionalidad individual
```bash
# F1 — Lead Creation
npx cypress run --spec "cypress/e2e/regression/R1_lead_creation.regression.cy.js" --browser chrome

# F2 — Opportunity Probability
npx cypress run --spec "cypress/e2e/regression/R2_opportunity_probability.regression.cy.js" --browser chrome

# F3 — Contact Search
npx cypress run --spec "cypress/e2e/regression/R3_contact_search.regression.cy.js" --browser chrome

# F4 — Meeting Scheduling
npx cypress run --spec "cypress/e2e/regression/R4_meeting_scheduling.regression.cy.js" --browser chrome

# F5 — Lead Conversion
npx cypress run --spec "cypress/e2e/regression/R5_lead_conversion.regression.cy.js" --browser chrome
```

## Junto con las E2E originales
```bash
# Solo E2E originales
npx cypress run --spec "cypress/e2e/F*.cy.js" --browser chrome

# Todo (E2E + Regresión)
npx cypress run --spec "cypress/e2e/**/*.cy.js" --browser chrome
```

> Ejecutar desde: `c:\Users\sqluser\Desktop\VyV\espocrm_VyV`

