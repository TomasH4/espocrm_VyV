/**
 * F1_lead_creation.cy.js
 *
 * Suite de pruebas E2E automatizadas para la Funcionalidad 1: Creación de un Cliente Potencial (Lead Creation)
 *
 * Principios FIRST:
 *   Fast            - Autenticación previa mediante API (loginViaApi) evitando renderizados lentos de login.
 *   Independent     - Cada test gestiona su propio ciclo de vida y limpia sus entidades en afterEach.
 *   Repeatable      - Sincronización determinista mediante interceptores de red (@alias) sin sleeps fijos.
 *   Self-Validating - Evaluación binaria PASS/FAIL mediante Fluent Assertions de Chai y Chai-jQuery.
 *   Timely          - Diseñado en base a los contratos de negocio de VyV EspoCRM.
 *
 * Patrón AAA (Arrange / Act / Assert).
 * Fluent Assertions: Encadenamiento fluido con .should().and() y expect().to...that...
 */

describe('Funcionalidad 1: Creación de un Cliente Potencial (Lead Creation)', () => {
  let createdLeadIds = [];

  beforeEach(() => {
    // [FIRST - Fast]: Inicio de sesión acelerado por API
    cy.loginViaApi();
  });

  afterEach(() => {
    // [FIRST - Independent]: Aislamiento estricto de datos, limpieza garantizada
    createdLeadIds.forEach((id) => {
      cy.deleteEntityViaApi('Lead', id);
    });
    createdLeadIds = [];
  });

  it('[Exitoso] Crea un Lead con todos los campos válidos y verifica su persistencia', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Preparación de datos de entrada y captura de llamada de red
    // -------------------------------------------------------------------------
    const leadData = {
      firstName: 'Carlos',
      lastName: 'Gómez',
      emailAddress: 'carlos.gomez@empresa.com',
      phoneNumber: '+573001234567',
    };

    cy.intercept('POST', '**/api/v1/Lead*').as('saveLeadRequest');

    // -------------------------------------------------------------------------
    // ACT: Diligenciamiento del formulario con aserciones de estado intermedias
    // -------------------------------------------------------------------------
    cy.visit('/#Lead/create');

    cy.get('input[data-name="firstName"]')
      .should('be.visible')
      .and('be.enabled')
      .type(leadData.firstName);

    cy.get('input[data-name="lastName"]')
      .should('be.visible')
      .and('be.enabled')
      .type(leadData.lastName);

    cy.get('input[data-name="emailAddress"]')
      .should('be.visible')
      .and('be.enabled')
      .type(leadData.emailAddress);

    cy.get('input[data-name="phoneNumber"]')
      .should('be.visible')
      .and('be.enabled')
      .type(leadData.phoneNumber);

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions encadenadas sobre la respuesta y la interfaz
    // -------------------------------------------------------------------------
    // Aserciones fluidas sobre la respuesta de red (Chai HTTP)
    cy.wait('@saveLeadRequest').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.is.oneOf([200, 201]);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('name')
        .which.includes(leadData.lastName);

      if (response.body.id) {
        createdLeadIds.push(response.body.id);
      }
    });

    // Fluent Assertions encadenadas en la interfaz (Chai-jQuery)
    cy.url()
      .should('include', '#Lead/view/')
      .and('not.include', '#Lead/create');

    cy.get('.header-title, .page-header, h3')
      .should('be.visible')
      .and('contain.text', `${leadData.firstName} ${leadData.lastName}`);
  });

  it('[Alternativo] Crea un Lead únicamente con el apellido obligatorio (sin email ni teléfono)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Preparación de carga mínima
    // -------------------------------------------------------------------------
    const minimalLastName = 'Torres';
    cy.intercept('POST', '**/api/v1/Lead*').as('saveMinimalLead');

    // -------------------------------------------------------------------------
    // ACT: Rellenar exclusivamente el apellido
    // -------------------------------------------------------------------------
    cy.visit('/#Lead/create');

    cy.get('input[data-name="lastName"]')
      .should('be.visible')
      .and('be.enabled')
      .type(minimalLastName);

    cy.get('input[data-name="emailAddress"]')
      .should('be.visible')
      .and('be.empty');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre creación exitosa sin datos opcionales
    // -------------------------------------------------------------------------
    cy.wait('@saveMinimalLead').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.is.oneOf([200, 201]);

      if (response.body.id) {
        createdLeadIds.push(response.body.id);
      }
    });

    cy.url()
      .should('include', '#Lead/view/')
      .and('not.include', 'create');

    cy.get('.header-title, .page-header, h3')
      .should('be.visible')
      .and('contain.text', minimalLastName);

    cy.get('.field-emailAddress, [data-name="emailAddress"]')
      .should('not.contain.text', '@');
  });

  it('[Error] Rechaza la creación cuando el apellido está vacío o contiene solo espacios', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Captura de llamada de error sintáctico
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Lead*').as('invalidSaveAttempt');

    // -------------------------------------------------------------------------
    // ACT: Intentar enviar con solo espacios en el apellido
    // -------------------------------------------------------------------------
    cy.visit('/#Lead/create');

    cy.get('input[data-name="firstName"]')
      .should('be.visible')
      .type('Carlos');

    cy.get('input[data-name="lastName"]')
      .should('be.visible')
      .clear()
      .type('     ');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre retención de formulario y feedback de error
    // -------------------------------------------------------------------------
    cy.url()
      .should('include', '#Lead/create')
      .and('not.include', 'view');

    cy.get('.has-error, .invalid-feedback, .text-danger, [data-name="lastName"].has-error')
      .should('be.visible')
      .and('exist');

    cy.get('.header-title, .page-header')
      .should('not.contain.text', 'Carlos');
  });

  it('[Error] Rechaza la creación cuando el email tiene un formato inválido', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Carga útil con sintaxis RFC inválida
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Lead*').as('invalidEmailAttempt');

    // -------------------------------------------------------------------------
    // ACT: Ingresar email sin dominio ni arroba
    // -------------------------------------------------------------------------
    cy.visit('/#Lead/create');

    cy.get('input[data-name="lastName"]')
      .should('be.visible')
      .type('Gómez');

    cy.get('input[data-name="emailAddress"]')
      .should('be.visible')
      .type('correo_sin_arroba.com');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre validación de campo en el DOM
    // -------------------------------------------------------------------------
    cy.url()
      .should('include', '#Lead/create');

    cy.get('.has-error, .invalid-feedback, .text-danger, [data-name="emailAddress"].has-error')
      .should('be.visible')
      .and('exist');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .and('contain.text', 'Save');
  });

  it('[Error] Manejo de error 500 al fallar la persistencia de base de datos (simulado con cy.intercept)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Simulación determinista de falla 500 sin tocar la BD real
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Lead*', {
      statusCode: 500,
      body: { error: 'Fallo en la persistencia de base de datos' },
    }).as('mockServerError');

    // -------------------------------------------------------------------------
    // ACT: Intentar guardar con datos válidos
    // -------------------------------------------------------------------------
    cy.visit('/#Lead/create');

    cy.get('input[data-name="lastName"]')
      .should('be.visible')
      .type('PersistenciaError');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre notificación y protección de pantalla
    // -------------------------------------------------------------------------
    cy.wait('@mockServerError').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.equals(500);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('error')
        .which.includes('Fallo en la persistencia');
    });

    cy.get('.notify, .notification, .alert-danger, .modal-dialog')
      .should('be.visible')
      .and('exist');

    cy.url()
      .should('include', '#Lead/create')
      .and('not.include', '#Lead/view/');
  });
});
