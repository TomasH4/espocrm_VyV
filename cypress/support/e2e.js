// cypress/support/e2e.js
import './commands';

// Prevenir que errores no capturados de scripts de terceros o dependencias de UI rompan los tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Retornar false evita que Cypress falle el test
  return false;
});

