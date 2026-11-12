/**
 * @file R2_opportunity_probability.regression.cy.js
 * @description Pruebas de REGRESIÓN para las reglas de probabilidad de Oportunidades.
 * Verifica que la asignación automática de probability según el stage
 * no cambie entre versiones de EspoCRM.
 *
 * Ejecutar: npx cypress run --spec "cypress/e2e/regression/R2_opportunity_probability.regression.cy.js"
 */

describe('[Regresión] Funcionalidad 2: Probabilidad de Oportunidad por Stage', () => {
  // ID de la oportunidad creada para limpiar en afterEach
  let createdOpportunityId = null;

  beforeEach(() => {
    // Autenticar via API antes de cada test
    cy.loginViaApi();
  });

  afterEach(() => {
    // Limpiar la oportunidad creada en el test para mantener independencia
    if (createdOpportunityId) {
      cy.deleteEntityViaApi('Opportunity', createdOpportunityId);
      createdOpportunityId = null;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R2.1 — Regla de negocio: Prospecting → probability = 10
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R2.1 — Stage "Prospecting" asigna probability exactamente igual a 10', () => {
    // Arrange: payload de oportunidad en etapa Prospecting
    const uid = Date.now();
    const payload = {
      name: `Regr_Prospecting_${uid}`,
      stage: 'Prospecting',
      amount: 5000,
      closeDate: '2026-12-31',
    };

    // Act: crear Opportunity via API
    cy.createEntityViaApi('Opportunity', payload).then((response) => {
      createdOpportunityId = response.body.id;

      // Assert: la probabilidad asignada automáticamente debe ser exactamente 10
      expect(response.body.probability).to.equal(10);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R2.2 — Regla de negocio: Closed Won → probability = 100
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R2.2 — Stage "Closed Won" asigna probability exactamente igual a 100', () => {
    // Arrange: payload de oportunidad ganada
    const uid = Date.now();
    const payload = {
      name: `Regr_ClosedWon_${uid}`,
      stage: 'Closed Won',
      amount: 10000,
      closeDate: '2026-12-31',
    };

    // Act: crear Opportunity via API
    cy.createEntityViaApi('Opportunity', payload).then((response) => {
      createdOpportunityId = response.body.id;

      // Assert: oportunidad ganada siempre tiene probability = 100
      expect(response.body.probability).to.equal(100);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R2.3 — Regla de negocio: Closed Lost → probability = 0
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R2.3 — Stage "Closed Lost" asigna probability exactamente igual a 0', () => {
    // Arrange: payload de oportunidad perdida
    const uid = Date.now();
    const payload = {
      name: `Regr_ClosedLost_${uid}`,
      stage: 'Closed Lost',
      amount: 3000,
      closeDate: '2026-12-31',
    };

    // Act: crear Opportunity via API
    cy.createEntityViaApi('Opportunity', payload).then((response) => {
      createdOpportunityId = response.body.id;

      // Assert: oportunidad perdida siempre tiene probability = 0
      expect(response.body.probability).to.equal(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R2.4 — Regla de negocio: actualizar stage cambia probability correctamente
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R2.4 — Actualizar stage de "Prospecting" a "Proposal" cambia probability a 50', () => {
    // Arrange: crear oportunidad en Prospecting (probability=10)
    const uid = Date.now();
    const payload = {
      name: `Regr_Update_${uid}`,
      stage: 'Prospecting',
      amount: 7500,
      closeDate: '2026-12-31',
    };

    cy.createEntityViaApi('Opportunity', payload).then((createResponse) => {
      createdOpportunityId = createResponse.body.id;

      // Act: actualizar stage a Proposal via PUT directo
      cy.request({
        method: 'PUT',
        url: `http://localhost:8080/api/v1/Opportunity/${createdOpportunityId}`,
        auth: { user: 'Tomas', pass: 'tomas12345' },
        body: { stage: 'Proposal' },
        failOnStatusCode: false,
      }).then((updateResponse) => {
        // Assert: la probability debe cambiar a 50 al pasar a Proposal
        expect(updateResponse.status).to.equal(200);
        expect(updateResponse.body.probability).to.equal(50);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R2.5 — Invariante de UI: formulario de Oportunidad tiene campos requeridos
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión UI] R2.5 — El formulario de creación de Oportunidad renderiza todos los campos requeridos', () => {
    // Arrange + Act: navegar al formulario de creación de Oportunidad
    cy.visit('/#Opportunity/create');

    // Assert: campo name visible
    cy.get('input[data-name="name"]')
      .should('exist')
      .and('be.visible');

    // Assert: campo amount visible
    cy.get('input[data-name="amount"]')
      .should('exist')
      .and('be.visible');

    // Assert: campo closeDate visible
    cy.get('input[data-name="closeDate"]')
      .should('exist')
      .and('be.visible');

    // Assert: selector de stage existe (puede ser select o Selectize)
    cy.get('[data-name="stage"]')
      .should('exist');

    // Assert: botón Save visible y habilitado
    cy.get('button[data-action="save"]')
      .should('exist')
      .and('be.visible')
      .and('not.be.disabled');
  });
});
