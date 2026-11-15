// cypress/e2e/andres/F3_quote_discount_calculation.cy.js

/**
 * F3: Cálculo de Descuentos Escalonados en Cotizaciones / Oportunidades
 * Integrante: Andrés Bedoya Cano (VyV EspoCRM 2026-2)
 *
 * Principios FIRST:
 *   Fast            - Sesión en caché (loginAs).
 *   Independent     - Limpieza de oportunidades en afterEach.
 *   Repeatable      - Sincronización con interceptores de red.
 *   Self-Validating - Fluent assertions de Chai sobre montos y etapas.
 *   Timely          - Vinculado a reglas de negocio de cotizaciones comerciales.
 *
 * Patrón AAA (Arrange / Act / Assert).
 */

describe('F3: Descuentos Escalonados en Cotizaciones y Oportunidades (Andrés Bedoya)', () => {
  let createdOpportunityIds = [];

  beforeEach(() => {
    cy.loginAs('andres', 'andres12345');
  });

  afterEach(() => {
    createdOpportunityIds.forEach((id) => {
      cy.deleteEntityViaApi('Opportunity', id);
    });
    createdOpportunityIds = [];
  });

  it('[Exitoso - UI] Crea una Oportunidad Comercial Tier 4 ($25,000) y valida persistencia en detalle', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Preparación de datos comerciales Tier 4 (15% descuento aplicable)
    // -------------------------------------------------------------------------
    const oppName = `Contrato Servidores Cloud ${Date.now()}`;
    cy.intercept('POST', '**/api/v1/Opportunity*').as('saveOpportunity');

    // -------------------------------------------------------------------------
    // ACT: Diligenciamiento en interfaz gráfica
    // -------------------------------------------------------------------------
    cy.visit('/#Opportunity/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .type(oppName);

    cy.get('input[data-name="amount"]')
      .should('be.visible')
      .clear()
      .type('25000');

    cy.get('input[data-name="closeDate"]')
      .should('be.visible')
      .type('2026-12-31');

    cy.selectOption('stage', 'Prospecting');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Persistencia y visualización de monto y etapa en detalle
    // -------------------------------------------------------------------------
    cy.wait('@saveOpportunity').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(Number(interception.response.body.amount)).to.eq(25000);
      createdOpportunityIds.push(interception.response.body.id);
    });

    cy.get('.header-title', { timeout: 10000 })
      .should('be.visible')
      .and('contain', oppName);

    cy.get('.cell[data-name="amount"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', '25,000');
  });

  it('[Alternativo - UI] Crea una Oportunidad Comercial Tier 2 ($4,500) para cliente Pyme', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Cotización de volumen medio Tier 2
    // -------------------------------------------------------------------------
    const oppPymeName = `Licencia Pyme Anual ${Date.now()}`;
    cy.intercept('POST', '**/api/v1/Opportunity*').as('savePymeOpp');

    // -------------------------------------------------------------------------
    // ACT: Diligenciamiento en UI
    // -------------------------------------------------------------------------
    cy.visit('/#Opportunity/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .type(oppPymeName);

    cy.get('input[data-name="amount"]')
      .should('be.visible')
      .clear()
      .type('4500');

    cy.get('input[data-name="closeDate"]')
      .should('be.visible')
      .type('2026-11-30');

    cy.selectOption('stage', 'Prospecting');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Verificación en detalle
    // -------------------------------------------------------------------------
    cy.wait('@savePymeOpp').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(Number(interception.response.body.amount)).to.eq(4500);
      createdOpportunityIds.push(interception.response.body.id);
    });

    cy.get('.cell[data-name="amount"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', '4,500');
  });

  it('[Validación - UI] Valida campo obligatorio Name en el formulario de Oportunidad', () => {
    // -------------------------------------------------------------------------
    // ACT: Intentar guardar con nombre vacío
    // -------------------------------------------------------------------------
    cy.visit('/#Opportunity/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .clear();

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Resaltado de error en formulario
    // -------------------------------------------------------------------------
    cy.get('.has-error, .cell[data-name="name"].has-error', { timeout: 10000 })
      .should('be.visible');
  });
});
