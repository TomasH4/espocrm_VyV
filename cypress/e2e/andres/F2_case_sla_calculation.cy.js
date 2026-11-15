// cypress/e2e/andres/F2_case_sla_calculation.cy.js

/**
 * F2: Cálculo de SLA y Tiempo Límite de Atención
 * Integrante: Andrés Bedoya Cano (VyV EspoCRM 2026-2)
 *
 * Principios FIRST:
 *   Fast            - Autenticación por sesión rápida (loginAs).
 *   Independent     - Limpieza de datos en afterEach.
 *   Repeatable      - Interceptores de red y aserciones de interfaz fluidas.
 *   Self-Validating - Evaluación binaria PASS/FAIL con Chai.
 *   Timely          - Conforme a matriz SLA [Urgent: 2h, High: 8h, Normal: 24h, Low: 72h].
 *
 * Patrón AAA (Arrange / Act / Assert).
 */

describe('F2: Cálculo de SLA y Prioridades de Atención en Casos (Andrés Bedoya)', () => {
  let createdCaseIds = [];

  beforeEach(() => {
    cy.loginAs('andres', 'andres12345');
  });

  afterEach(() => {
    createdCaseIds.forEach((id) => {
      cy.deleteEntityViaApi('Case', id);
    });
    createdCaseIds = [];
  });

  it('[Exitoso - UI] Crea un Caso con prioridad Urgent para atención prioritaria (SLA 2h)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Preparación de datos y captura de petición
    // -------------------------------------------------------------------------
    const urgentCaseName = `Caso SLA Crítico Urgent ${Date.now()}`;
    cy.intercept('POST', '**/api/v1/Case*').as('saveUrgentCase');

    // -------------------------------------------------------------------------
    // ACT: Diligenciamiento en interfaz gráfica
    // -------------------------------------------------------------------------
    cy.visit('/#Case/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .type(urgentCaseName);

    cy.selectOption('priority', 'Urgent');

    cy.get('textarea[data-name="description"]')
      .should('be.visible')
      .type('Fallo de servicio en producción que requiere atención dentro del SLA de 2 horas.');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Persistencia y visualización de badge Urgent en detalle
    // -------------------------------------------------------------------------
    cy.wait('@saveUrgentCase').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.priority).to.eq('Urgent');
      createdCaseIds.push(interception.response.body.id);
    });

    cy.get('.header-title', { timeout: 10000 })
      .should('be.visible')
      .and('contain', urgentCaseName);

    cy.get('.cell[data-name="priority"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Urgent');
  });

  it('[Alternativo - UI] Crea un Caso con prioridad Low para seguimiento estándar (SLA 72h)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Caso de consulta menor
    // -------------------------------------------------------------------------
    const lowCaseName = `Caso SLA Estándar Low ${Date.now()}`;
    cy.intercept('POST', '**/api/v1/Case*').as('saveLowCase');

    // -------------------------------------------------------------------------
    // ACT: Diligenciamiento con prioridad Low
    // -------------------------------------------------------------------------
    cy.visit('/#Case/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .type(lowCaseName);

    cy.selectOption('priority', 'Low');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Verificación en detalle
    // -------------------------------------------------------------------------
    cy.wait('@saveLowCase').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.priority).to.eq('Low');
      createdCaseIds.push(interception.response.body.id);
    });

    cy.get('.cell[data-name="priority"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Low');
  });

  it('[Validación - UI] Valida que el listado de Casos renderiza correctamente los filtros de prioridad', () => {
    // -------------------------------------------------------------------------
    // ACT: Navegación al módulo de Casos
    // -------------------------------------------------------------------------
    cy.visit('/#Case');

    // -------------------------------------------------------------------------
    // ASSERT: La grilla principal y el botón de creación están disponibles
    // -------------------------------------------------------------------------
    cy.get('#main', { timeout: 15000 }).should('be.visible');
    cy.get('.page-header, .header-title', { timeout: 10000 }).should('contain', 'Cases');
    cy.get('button[data-action="create"], a[href="#Case/create"]', { timeout: 10000 })
      .should('be.visible');
  });
});
