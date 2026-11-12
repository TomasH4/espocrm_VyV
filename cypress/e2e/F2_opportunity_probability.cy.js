/**
 * F2_opportunity_probability.cy.js
 *
 * Suite de pruebas E2E automatizadas para la Funcionalidad 2: Cálculo automático de probabilidad en Oportunidades
 *
 * Principios FIRST:
 *   Fast            - Sesión inicializada vía API/cy.session; sin latencia de pantalla de login.
 *   Independent     - Cada test instancia o limpia sus propias oportunidades en BD.
 *   Repeatable      - Respuestas y transiciones sincronizadas con alias de red.
 *   Self-Validating - Fluent Assertions encadenadas sobre propiedades numéricas exactas.
 *   Timely          - Vinculado a la matriz de reglas de negocio [0%, 10%, 50%, 100%].
 *
 * Patrón AAA (Arrange / Act / Assert).
 * Fluent Assertions: Chai .should().and() y expect(obj).to.have.property().that...
 */

describe('Funcionalidad 2: Cálculo Automático de Probabilidad en Oportunidades', () => {
  let createdOpportunityIds = [];

  beforeEach(() => {
    // [FIRST - Fast]: Autenticación acelerada por API / sesión
    cy.loginViaApi();
  });

  afterEach(() => {
    // [FIRST - Independent]: Aislamiento estricto de datos
    createdOpportunityIds.forEach((id) => {
      cy.deleteEntityViaApi('Opportunity', id);
    });
    createdOpportunityIds = [];
  });

  it('[Exitoso] Asigna automáticamente 10% de probabilidad para la etapa Prospecting', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Intercepción y preparación
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Opportunity*').as('createProspecting');

    // -------------------------------------------------------------------------
    // ACT: Crear oportunidad con etapa Prospecting
    // -------------------------------------------------------------------------
    cy.visit('/#Opportunity/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .and('be.enabled')
      .type('Oportunidad Prospecting Test');

    cy.get('input[data-name="amount"]')
      .should('be.visible')
      .type('10000');

    cy.get('input[data-name="closeDate"]')
      .should('be.visible')
      .type('2026-12-31');

    cy.selectOption('stage', 'Prospecting');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre probabilidad 10%
    // -------------------------------------------------------------------------
    cy.wait('@createProspecting').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.is.oneOf([200, 201]);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('probability')
        .which.equals(10);

      if (response.body.id) {
        createdOpportunityIds.push(response.body.id);
      }
    });

    cy.url()
      .should('include', '#Opportunity/view/');

    cy.get('[data-name="probability"], .field-probability')
      .should('be.visible')
      .and('contain.text', '10');

    cy.get('[data-name="stage"], .field-stage')
      .should('be.visible')
      .and('contain.text', 'Prospecting');
  });

  it('[Exitoso] Asigna automáticamente 100% de probabilidad para la etapa Closed Won', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Interceptar creación
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Opportunity*').as('createClosedWon');

    // -------------------------------------------------------------------------
    // ACT: Seleccionar etapa Closed Won
    // -------------------------------------------------------------------------
    cy.visit('/#Opportunity/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .type('Oportunidad Ganada Test');

    cy.get('input[data-name="amount"]')
      .should('be.visible')
      .type('20000');

    cy.get('input[data-name="closeDate"]')
      .should('be.visible')
      .type('2026-12-31');

    cy.selectOption('stage', 'Closed Won');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre probabilidad máxima de 100%
    // -------------------------------------------------------------------------
    cy.wait('@createClosedWon').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.is.oneOf([200, 201]);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('probability')
        .which.equals(100);

      if (response.body.id) {
        createdOpportunityIds.push(response.body.id);
      }
    });

    cy.url()
      .should('include', '#Opportunity/view/');

    cy.get('[data-name="probability"], .field-probability')
      .should('be.visible')
      .and('contain.text', '100');

    cy.get('[data-name="stage"], .field-stage')
      .should('be.visible')
      .and('contain.text', 'Closed Won');
  });

  it('[Exitoso] Asigna automáticamente 0% de probabilidad para la etapa Closed Lost', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Intercepción de llamada
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Opportunity*').as('createClosedLost');

    // -------------------------------------------------------------------------
    // ACT: Seleccionar etapa Closed Lost
    // -------------------------------------------------------------------------
    cy.visit('/#Opportunity/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .type('Oportunidad Perdida Test');

    cy.get('input[data-name="amount"]')
      .should('be.visible')
      .type('5000');

    cy.get('input[data-name="closeDate"]')
      .should('be.visible')
      .type('2026-12-31');

    cy.selectOption('stage', 'Closed Lost');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre límite inferior de 0%
    // -------------------------------------------------------------------------
    cy.wait('@createClosedLost').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.is.oneOf([200, 201]);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('probability')
        .which.equals(0);

      if (response.body.id) {
        createdOpportunityIds.push(response.body.id);
      }
    });

    cy.url()
      .should('include', '#Opportunity/view/');

    cy.get('[data-name="probability"], .field-probability')
      .should('be.visible')
      .and('contain.text', '0');

    cy.get('[data-name="stage"], .field-stage')
      .should('be.visible')
      .and('contain.text', 'Closed Lost');
  });

  it('[Alternativo] Recalcula dinámicamente la probabilidad de 10% a 50% al actualizar de Prospecting a Proposal', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Crear oportunidad inicial via API para maximizar velocidad
    // -------------------------------------------------------------------------
    cy.createEntityViaApi('Opportunity', {
      name: 'Oportunidad Transición Etapa',
      stage: 'Prospecting',
      amount: 15000,
      closeDate: '2026-12-31',
      probability: 10,
    }).then(({ body }) => {
      const optId = body.id;
      createdOpportunityIds.push(optId);

      cy.intercept('PUT', `**/api/v1/Opportunity/${optId}*`).as('updateOpportunity');

      // -------------------------------------------------------------------------
      // ACT: Navegar a editar y cambiar a etapa Proposal
      // -------------------------------------------------------------------------
      cy.visit(`/#Opportunity/edit/${optId}`);

      cy.selectOption('stage', 'Proposal');

      cy.get('button[data-action="save"]')
        .should('be.visible')
        .click();

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre recálculo en respuesta y UI
      // -------------------------------------------------------------------------
      cy.wait('@updateOpportunity').then(({ response }) => {
        expect(response)
          .to.have.property('statusCode')
          .that.is.oneOf([200, 201]);

        expect(response.body)
          .to.be.an('object')
          .that.has.property('probability')
          .which.equals(50);
      });

      cy.url()
        .should('include', '#Opportunity/view/');

      cy.get('[data-name="probability"], .field-probability')
        .should('be.visible')
        .and('contain.text', '50');

      cy.get('[data-name="stage"], .field-stage')
        .should('be.visible')
        .and('contain.text', 'Proposal');
    });
  });

  it('[Error] Manejo de error 500 al fallar el cálculo o persistencia de la oportunidad (simulado con cy.intercept)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Intercepción simulando falla de base de datos
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Opportunity*', {
      statusCode: 500,
      body: { error: 'Fallo en la persistencia de base de datos' },
    }).as('mockOpportunityError');

    // -------------------------------------------------------------------------
    // ACT: Intentar crear con datos válidos
    // -------------------------------------------------------------------------
    cy.visit('/#Opportunity/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .type('Oportunidad Error 500');

    cy.get('input[data-name="amount"]')
      .should('be.visible')
      .type('8000');

    cy.get('input[data-name="closeDate"]')
      .should('be.visible')
      .type('2026-12-31');

    cy.selectOption('stage', 'Proposal');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre notificación y permanencia en vista
    // -------------------------------------------------------------------------
    cy.wait('@mockOpportunityError').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.equals(500);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('error')
        .which.includes('Fallo en la persistencia');
    });

    cy.get('.notify, .notification, .alert-danger')
      .should('be.visible')
      .and('exist');

    cy.url()
      .should('include', '#Opportunity/create')
      .and('not.include', 'view');
  });
});
