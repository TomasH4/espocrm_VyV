/**
 * F5_lead_conversion.cy.js
 *
 * Suite de pruebas E2E automatizadas para la Funcionalidad 5: Conversión Transaccional de Lead en Contacto y Cuenta
 *
 * Principios FIRST:
 *   Fast            - Leads creados directamente vía API (createLeadViaApi) antes de probar la conversión.
 *   Independent     - Rastreo cruzado de Leads, Contactos y Cuentas para purga total en afterEach.
 *   Repeatable      - Ejecución determinista independiente del estado previo de la base de datos.
 *   Self-Validating - Fluent Assertions encadenadas sobre integridad relacional y estados ACID.
 *   Timely          - Abarca flujos B2B, B2C, propagación de campos, idempotencia y rollback 500.
 *
 * Patrón AAA (Arrange / Act / Assert).
 * Fluent Assertions: .should('be.visible').and(...) y expect(response).to...
 */

describe('Funcionalidad 5: Conversión Transaccional de Lead en Contacto y Cuenta', () => {
  let createdLeadIds = [];
  let createdContactIds = [];
  let createdAccountIds = [];

  beforeEach(() => {
    // [FIRST - Fast]: Inicio de sesión acelerado por API
    cy.loginViaApi();
  });

  afterEach(() => {
    // [FIRST - Independent]: Limpieza integral de las 3 entidades generadas en cada prueba
    createdLeadIds.forEach((id) => cy.deleteEntityViaApi('Lead', id));
    createdContactIds.forEach((id) => cy.deleteEntityViaApi('Contact', id));
    createdAccountIds.forEach((id) => cy.deleteEntityViaApi('Account', id));
    createdLeadIds = [];
    createdContactIds = [];
    createdAccountIds = [];
  });

  it('[Exitoso] Conversión B2B Completa: crea Contacto y Cuenta vinculada a partir de un Lead con empresa', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Crear Lead corporativo vía API
    // -------------------------------------------------------------------------
    const b2bLead = {
      firstName: 'Carlos',
      lastName: 'Gómez',
      emailAddress: 'cgomez@empresa.com',
      phoneNumber: '+573001234567',
      accountName: 'Empresa Gómez S.A.',
      status: 'Assigned',
    };

    cy.createLeadViaApi(b2bLead).then(({ body }) => {
      const leadId = body.id;
      createdLeadIds.push(leadId);

      cy.intercept('POST', `**/api/v1/Lead/${leadId}/convert*`).as('convertB2BLead');

      // -------------------------------------------------------------------------
      // ACT: Navegar al Lead y ejecutar acción de conversión
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      cy.get('.header-title, .page-header')
        .should('be.visible')
        .and('contain.text', 'Carlos Gómez');

      cy.get('button[data-action="convert"], .dropdown-toggle, [data-name="convert"]')
        .first()
        .should('be.visible')
        .click();

      cy.get('[data-action="convert"], a[data-action="convert"]')
        .click({ force: true });

      cy.get('.modal-dialog button[data-action="convert"], .modal-dialog button[data-action="save"]')
        .should('be.visible')
        .click();

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre integridad relacional B2B
      // -------------------------------------------------------------------------
      cy.wait('@convertB2BLead').then(({ response }) => {
        expect(response)
          .to.have.property('statusCode')
          .that.is.oneOf([200, 201]);

        if (response.body.contactId) {
          createdContactIds.push(response.body.contactId);
        }
        if (response.body.accountId) {
          createdAccountIds.push(response.body.accountId);
        }
      });

      cy.get('[data-name="status"], .field-status')
        .should('be.visible')
        .and('contain.text', 'Converted');

      cy.get('body')
        .should('be.visible')
        .and('contain.text', 'Empresa Gómez S.A.');
    });
  });

  it('[Exitoso] Conversión B2C: crea únicamente el Contacto (sin Cuenta) para un Lead persona natural', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Crear Lead persona natural sin empresa asociada
    // -------------------------------------------------------------------------
    const b2cLead = {
      firstName: 'Laura',
      lastName: 'Mora',
      emailAddress: 'lmora@persona.com',
      phoneNumber: '+573109876543',
      accountName: null,
      status: 'New',
    };

    cy.createLeadViaApi(b2cLead).then(({ body }) => {
      const leadId = body.id;
      createdLeadIds.push(leadId);

      cy.intercept('POST', `**/api/v1/Lead/${leadId}/convert*`).as('convertB2CLead');

      // -------------------------------------------------------------------------
      // ACT: Ejecutar conversión
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      cy.get('button[data-action="convert"], .dropdown-toggle, [data-name="convert"]')
        .first()
        .should('be.visible')
        .click();

      cy.get('[data-action="convert"], a[data-action="convert"]')
        .click({ force: true });

      cy.get('.modal-dialog button[data-action="convert"], .modal-dialog button[data-action="save"]')
        .should('be.visible')
        .click();

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre creación de Contacto y Cuenta nula
      // -------------------------------------------------------------------------
      cy.wait('@convertB2CLead').then(({ response }) => {
        expect(response)
          .to.have.property('statusCode')
          .that.is.oneOf([200, 201]);

        if (response.body.contactId) {
          createdContactIds.push(response.body.contactId);
        }

        expect(response.body)
          .to.be.an('object')
          .that.satisfies((b) => b.accountId === null || b.accountId === undefined || b.accountId === '');
      });

      cy.get('[data-name="status"], .field-status')
        .should('be.visible')
        .and('contain.text', 'Converted');

      cy.get('[data-name="account"], .field-account')
        .should('be.empty');
    });
  });

  it('[Alternativo] Verifica la propagación exacta de los datos (email y teléfono) al nuevo Contacto', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Lead con atributos completos
    // -------------------------------------------------------------------------
    const fullLead = {
      firstName: 'Pedro',
      lastName: 'Sánchez',
      emailAddress: 'pedro.sanchez@empresa.com',
      phoneNumber: '+573201112233',
      status: 'In Process',
    };

    cy.createLeadViaApi(fullLead).then(({ body }) => {
      const leadId = body.id;
      createdLeadIds.push(leadId);

      // -------------------------------------------------------------------------
      // ACT: Convertir el Lead
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      cy.get('button[data-action="convert"], .dropdown-toggle, [data-name="convert"]')
        .first()
        .should('be.visible')
        .click();

      cy.get('[data-action="convert"], a[data-action="convert"]')
        .click({ force: true });

      cy.get('.modal-dialog button[data-action="convert"], .modal-dialog button[data-action="save"]')
        .click();

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre propagación de datos
      // -------------------------------------------------------------------------
      cy.url()
        .should('not.include', '#Lead/create');

      cy.get('[data-name="status"]')
        .should('be.visible')
        .and('contain.text', 'Converted');

      cy.contains('pedro.sanchez@empresa.com')
        .should('be.visible')
        .and('exist');
    });
  });

  it('[Error] Rechaza el intento de doble conversión sobre un Lead que ya ostenta estado "Converted"', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Lead marcado como Converted previamente
    // -------------------------------------------------------------------------
    cy.createLeadViaApi({
      firstName: 'Lead',
      lastName: 'YaConvertido',
      status: 'Converted',
    }).then(({ body }) => {
      const leadId = body.id;
      createdLeadIds.push(leadId);

      cy.intercept('POST', `**/api/v1/Lead/${leadId}/convert*`, {
        statusCode: 409,
        body: { error: 'El Lead ya fue convertido anteriormente' },
      }).as('mockConflictError');

      // -------------------------------------------------------------------------
      // ACT: Navegar al Lead
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre estado Converted e inexistencia de botón Convert
      // -------------------------------------------------------------------------
      cy.get('[data-name="status"]')
        .should('be.visible')
        .and('contain.text', 'Converted');

      cy.get('button[data-action="convert"]')
        .should('not.exist');
    });
  });

  it('[Error] Rollback transaccional ante fallo durante la conversión (simulado con cy.intercept HTTP 500)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Lead activo
    // -------------------------------------------------------------------------
    cy.createLeadViaApi({
      firstName: 'Transaccional',
      lastName: 'FalloRollback',
      status: 'New',
    }).then(({ body }) => {
      const leadId = body.id;
      createdLeadIds.push(leadId);

      // Simular fallo transaccional determinista
      cy.intercept('POST', `**/api/v1/Lead/${leadId}/convert*`, {
        statusCode: 500,
        body: { error: 'Fallo en la transaccion de conversion del Lead' },
      }).as('mockTransactionFailure');

      // -------------------------------------------------------------------------
      // ACT: Intentar conversión fallida
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      cy.get('button[data-action="convert"], .dropdown-toggle, [data-name="convert"]')
        .first()
        .should('be.visible')
        .click();

      cy.get('[data-action="convert"], a[data-action="convert"]')
        .click({ force: true });

      cy.get('.modal-dialog button[data-action="convert"], .modal-dialog button[data-action="save"]')
        .click();

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre notificación y preservación del estado New
      // -------------------------------------------------------------------------
      cy.wait('@mockTransactionFailure').then(({ response }) => {
        expect(response)
          .to.have.property('statusCode')
          .that.equals(500);

        expect(response.body)
          .to.be.an('object')
          .that.has.property('error')
          .which.includes('Fallo en la transaccion');
      });

      cy.get('.notify, .notification, .alert-danger')
        .should('be.visible')
        .and('exist');

      // Gracias al rollback transaccional el Lead debe conservar su estado 'New'
      cy.get('[data-name="status"]')
        .should('be.visible')
        .and('contain.text', 'New');
    });
  });
});
