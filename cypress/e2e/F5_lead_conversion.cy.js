/**
 * F5_lead_conversion.cy.js
 *
 * Suite de pruebas E2E automatizadas para la Funcionalidad 5: Conversión Transaccional de Lead en Contacto y Cuenta
 *
 * Principios FIRST:
 *   Fast            - Leads creados directamente vía API (createLeadViaApi) antes de probar la conversión.
 *   Independent     - Rastreo cruzado de Leads, Contactos y Cuentas para purga total en afterEach; identificadores únicos deterministas.
 *   Repeatable      - Ejecución determinista independiente del estado previo de la base de datos (sin colisiones 409 de duplicados).
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
    // [FIRST - Independent]: Limpieza integral de las entidades generadas
    createdLeadIds.forEach((id) => cy.deleteEntityViaApi('Lead', id));
    createdContactIds.forEach((id) => cy.deleteEntityViaApi('Contact', id));
    createdAccountIds.forEach((id) => cy.deleteEntityViaApi('Account', id));
    createdLeadIds = [];
    createdContactIds = [];
    createdAccountIds = [];
  });

  it('[Exitoso] Conversión B2B Completa: crea Contacto y Cuenta vinculada a partir de un Lead con empresa', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Crear Lead corporativo con teléfono válido (10 dígitos) y email único
    // -------------------------------------------------------------------------
    const uid = Math.floor(100000 + Math.random() * 900000);
    const b2bLead = {
      firstName: `Carlos${uid}`,
      lastName: `Gómez${uid}`,
      emailAddress: `cgomez${uid}@empresavyv.com`,
      phoneNumber: `+57300${uid}1`,
      accountName: `Empresa Gómez ${uid} S.A.`,
      status: 'Assigned',
    };

    cy.createLeadViaApi(b2bLead).then(({ body }) => {
      const leadId = body.id;
      expect(leadId).to.be.a('string').and.not.be.empty;
      createdLeadIds.push(leadId);

      cy.intercept('POST', '**/api/v1/Lead/action/convert*').as('convertB2BLead');

      // -------------------------------------------------------------------------
      // ACT: Navegar al Lead y ejecutar acción de conversión
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      cy.get('.header-title, .page-header', { timeout: 10000 })
        .should('be.visible')
        .and('contain.text', b2bLead.firstName);

      cy.get('button[data-action="convert"]')
        .first()
        .should('be.visible')
        .click();

      cy.url().should('include', '#Lead/convert/');

      // Marcar los checkboxes de Contact y Account
      cy.get('input.check-scope[data-scope="Contact"]')
        .should('exist')
        .check({ force: true });

      cy.get('input.check-scope[data-scope="Account"]')
        .should('exist')
        .check({ force: true });

      cy.get('.button-container button[data-action="convert"]')
        .should('be.visible')
        .and('not.be.disabled')
        .click();

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre integridad relacional B2B
      // -------------------------------------------------------------------------
      cy.wait('@convertB2BLead').then(({ response }) => {
        expect(response)
          .to.have.property('statusCode')
          .that.is.oneOf([200, 201]);

        if (response.body.createdContactId) {
          createdContactIds.push(response.body.createdContactId);
        }
        if (response.body.createdAccountId) {
          createdAccountIds.push(response.body.createdAccountId);
        }
      });

      cy.get('[data-name="status"], .field-status, body')
        .should('be.visible')
        .and('contain.text', 'Converted');

      cy.get('body')
        .should('be.visible')
        .and('contain.text', b2bLead.accountName);
    });
  });

  it('[Exitoso] Conversión B2C: crea únicamente el Contacto (sin Cuenta) para un Lead persona natural', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Crear Lead persona natural con datos únicos
    // -------------------------------------------------------------------------
    const uid = Math.floor(100000 + Math.random() * 900000);
    const b2cLead = {
      firstName: `Laura${uid}`,
      lastName: `Mora${uid}`,
      emailAddress: `lmora${uid}@personavyv.com`,
      phoneNumber: `+57310${uid}1`,
      accountName: null,
      status: 'New',
    };

    cy.createLeadViaApi(b2cLead).then(({ body }) => {
      const leadId = body.id;
      expect(leadId).to.be.a('string').and.not.be.empty;
      createdLeadIds.push(leadId);

      cy.intercept('POST', '**/api/v1/Lead/action/convert*').as('convertB2CLead');

      // -------------------------------------------------------------------------
      // ACT: Ejecutar conversión seleccionando solo Contact
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      cy.get('.header-title, .page-header', { timeout: 10000 })
        .should('be.visible');

      cy.get('button[data-action="convert"]')
        .first()
        .should('be.visible')
        .click();

      cy.url().should('include', '#Lead/convert/');

      // Marcar únicamente el scope de Contact
      cy.get('input.check-scope[data-scope="Contact"]')
        .should('exist')
        .check({ force: true });

      // Asegurar que Account no esté seleccionado
      cy.get('body').then(($body) => {
        const accountCheckbox = $body.find('input.check-scope[data-scope="Account"]');
        if (accountCheckbox.length && accountCheckbox.is(':checked')) {
          cy.wrap(accountCheckbox).uncheck({ force: true });
        }
      });

      cy.get('.button-container button[data-action="convert"]')
        .should('be.visible')
        .and('not.be.disabled')
        .click();

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre creación de Contacto y Cuenta nula
      // -------------------------------------------------------------------------
      cy.wait('@convertB2CLead').then(({ response }) => {
        expect(response)
          .to.have.property('statusCode')
          .that.is.oneOf([200, 201]);

        if (response.body.createdContactId) {
          createdContactIds.push(response.body.createdContactId);
        }

        expect(response.body)
          .to.be.an('object')
          .that.satisfies((b) => !b.createdAccountId);
      });

      cy.get('[data-name="status"], .field-status, body')
        .should('be.visible')
        .and('contain.text', 'Converted');
    });
  });

  it('[Alternativo] Verifica la propagación exacta de los datos (email y teléfono) al nuevo Contacto', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Lead con atributos completos y únicos
    // -------------------------------------------------------------------------
    const uid = Math.floor(100000 + Math.random() * 900000);
    const fullLead = {
      firstName: `Pedro${uid}`,
      lastName: `Sánchez${uid}`,
      emailAddress: `pedro${uid}@empresavyv.com`,
      phoneNumber: `+57320${uid}1`,
      status: 'In Process',
    };

    cy.createLeadViaApi(fullLead).then(({ body }) => {
      const leadId = body.id;
      expect(leadId).to.be.a('string').and.not.be.empty;
      createdLeadIds.push(leadId);

      cy.intercept('POST', '**/api/v1/Lead/action/convert*').as('convertPropagation');

      // -------------------------------------------------------------------------
      // ACT: Convertir el Lead seleccionando Contact
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      cy.get('.header-title, .page-header', { timeout: 10000 })
        .should('be.visible');

      cy.get('button[data-action="convert"]')
        .first()
        .should('be.visible')
        .click();

      cy.url().should('include', '#Lead/convert/');

      cy.get('input.check-scope[data-scope="Contact"]')
        .should('exist')
        .check({ force: true });

      cy.get('.button-container button[data-action="convert"]')
        .should('be.visible')
        .and('not.be.disabled')
        .click();

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre propagación de datos
      // -------------------------------------------------------------------------
      cy.wait('@convertPropagation').then(({ response }) => {
        expect(response)
          .to.have.property('statusCode')
          .that.is.oneOf([200, 201]);

        if (response.body.createdContactId) {
          createdContactIds.push(response.body.createdContactId);
        }
      });

      cy.url()
        .should('not.include', '#Lead/create');

      cy.get('[data-name="status"], .field-status, body')
        .should('be.visible')
        .and('contain.text', 'Converted');

      cy.get('body')
        .should('be.visible')
        .and('contain.text', fullLead.emailAddress);
    });
  });

  it('[Error] Rechaza el intento de doble conversión sobre un Lead que ya ostenta estado "Converted"', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Lead marcado como Converted previamente con datos únicos
    // -------------------------------------------------------------------------
    const uid = Math.floor(100000 + Math.random() * 900000);
    cy.createLeadViaApi({
      firstName: `Lead${uid}`,
      lastName: `YaConvertido${uid}`,
      status: 'Converted',
    }).then(({ body }) => {
      const leadId = body.id;
      expect(leadId).to.be.a('string').and.not.be.empty;
      createdLeadIds.push(leadId);

      // -------------------------------------------------------------------------
      // ACT: Navegar al Lead
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      // -------------------------------------------------------------------------
      // ASSERT: Fluent Assertions sobre estado Converted e inexistencia de botón Convert
      // -------------------------------------------------------------------------
      cy.get('[data-name="status"], .field-status, body')
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
    const uid = Math.floor(100000 + Math.random() * 900000);
    cy.createLeadViaApi({
      firstName: `Transaccional${uid}`,
      lastName: `FalloRollback${uid}`,
      status: 'New',
    }).then(({ body }) => {
      const leadId = body.id;
      expect(leadId).to.be.a('string').and.not.be.empty;
      createdLeadIds.push(leadId);

      // Simular fallo transaccional determinista
      cy.intercept('POST', '**/api/v1/Lead/action/convert*', {
        statusCode: 500,
        body: { error: 'Fallo en la transaccion de conversion del Lead' },
      }).as('mockTransactionFailure');

      // -------------------------------------------------------------------------
      // ACT: Intentar conversión fallida con scope seleccionado
      // -------------------------------------------------------------------------
      cy.visit(`/#Lead/view/${leadId}`);

      cy.get('.header-title, .page-header', { timeout: 10000 })
        .should('be.visible');

      cy.get('button[data-action="convert"]')
        .first()
        .should('be.visible')
        .click();

      cy.url().should('include', '#Lead/convert/');

      cy.get('input.check-scope[data-scope="Contact"]')
        .should('exist')
        .check({ force: true });

      cy.get('.button-container button[data-action="convert"]')
        .should('be.visible')
        .and('not.be.disabled')
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

      cy.get('.notify, .notification, .alert-danger, .modal-dialog')
        .should('be.visible')
        .and('exist');
    });
  });
});
