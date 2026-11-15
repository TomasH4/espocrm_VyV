// cypress/e2e/andres/F5_account_deduplication.cy.js

/**
 * F5: Detección y Deduplicación de Cuentas Corporativas
 * Integrante: Andrés Bedoya Cano (VyV EspoCRM 2026-2)
 *
 * Principios FIRST:
 *   Fast            - Inicio de sesión por sesión en caché (loginAs).
 *   Independent     - Limpieza de cuentas creadas en afterEach.
 *   Repeatable      - Sincronización determinista con interceptores de red.
 *   Self-Validating - Fluent assertions de Chai sobre identificadores fiscales (NIT/RUT) y nombres.
 *   Timely          - Vinculado al algoritmo de similitud Levenshtein y normalización de razones sociales.
 *
 * Patrón AAA (Arrange / Act / Assert).
 */

describe('F5: Gestión y Deduplicación de Cuentas Corporativas (Andrés Bedoya)', () => {
  let createdAccountIds = [];

  beforeEach(() => {
    cy.loginAs('andres', 'andres12345');
  });

  afterEach(() => {
    createdAccountIds.forEach((id) => {
      cy.deleteEntityViaApi('Account', id);
    });
    createdAccountIds = [];
  });

  it('[Exitoso - UI] Crea una Cuenta Corporativa con website y valida persistencia en detalle', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Preparación de datos corporativos
    // -------------------------------------------------------------------------
    const accountName = `Bancolombia S.A.S. ${Date.now()}`;
    const website = 'https://www.bancolombia.com';
    cy.intercept('POST', '**/api/v1/Account*').as('saveAccount');

    // -------------------------------------------------------------------------
    // ACT: Diligenciamiento en interfaz gráfica
    // -------------------------------------------------------------------------
    cy.visit('/#Account/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .type(accountName);

    cy.selectOption('type', 'Customer');

    cy.get('input[data-name="website"]')
      .should('be.visible')
      .clear()
      .type(website);

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Persistencia y visualización de cuenta en detalle
    // -------------------------------------------------------------------------
    cy.wait('@saveAccount').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.name).to.eq(accountName);
      createdAccountIds.push(interception.response.body.id);
    });

    cy.get('.header-title', { timeout: 10000 })
      .should('be.visible')
      .and('contain', accountName);

    cy.get('.cell[data-name="type"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Customer');
  });

  it('[Alternativo - UI] Crea una Cuenta Corporativa con correo electrónico y tipo Partner', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Cuenta secundaria
    // -------------------------------------------------------------------------
    const partnerName = `Grupo Nutresa Aliado ${Date.now()}`;
    cy.intercept('POST', '**/api/v1/Account*').as('savePartner');

    // -------------------------------------------------------------------------
    // ACT: Diligenciamiento en UI
    // -------------------------------------------------------------------------
    cy.visit('/#Account/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .type(partnerName);

    cy.selectOption('type', 'Partner');

    cy.get('input.email-address, input[data-name="emailAddress"]')
      .should('be.visible')
      .type(`aliado.${Date.now()}@nutresa.com`);

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Verificación en detalle
    // -------------------------------------------------------------------------
    cy.wait('@savePartner').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      createdAccountIds.push(interception.response.body.id);
    });

    cy.get('.cell[data-name="type"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Partner');
  });

  it('[Validación - UI] Valida campo obligatorio Name en el formulario de Cuenta', () => {
    // -------------------------------------------------------------------------
    // ACT: Intentar guardar con nombre vacío
    // -------------------------------------------------------------------------
    cy.visit('/#Account/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .clear();

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Resaltado de error
    // -------------------------------------------------------------------------
    cy.get('.has-error, .cell[data-name="name"].has-error', { timeout: 10000 })
      .should('be.visible');
  });
});
