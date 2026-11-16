/**
 * @file R5_lead_conversion.regression.cy.js
 * @description Pruebas de REGRESIÓN para la conversión de Leads en EspoCRM.
 * Verifica que el flujo de conversión de Lead a Contact/Account funcione
 * correctamente, que el status cambie a 'Converted' y que los elementos
 * de UI de conversión estén presentes o ausentes según corresponda.
 *
 * Ejecutar: npx cypress run --spec "cypress/e2e/regression/R5_lead_conversion.regression.cy.js"
 */

describe('[Regresión] Funcionalidad 5: Conversión de Lead', () => {
  // IDs de entidades creadas para limpiar en afterEach
  let createdLeadId = null;
  let createdContactId = null;
  let createdAccountId = null;

  beforeEach(() => {
    // Autenticar via API antes de cada test
    cy.loginViaApi();
  });

  afterEach(() => {
    // Limpiar en orden inverso de dependencia: Contact/Account antes que Lead
    if (createdContactId) {
      cy.deleteEntityViaApi('Contact', createdContactId);
      createdContactId = null;
    }
    if (createdAccountId) {
      cy.deleteEntityViaApi('Account', createdAccountId);
      createdAccountId = null;
    }
    if (createdLeadId) {
      cy.deleteEntityViaApi('Lead', createdLeadId);
      createdLeadId = null;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R5.1 — Regla de negocio: Lead convertido tiene status="Converted" en API
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R5.1 — Un Lead convertido tiene status "Converted" en la API', () => {
    // Arrange: crear Lead con datos únicos
    const uid = Date.now();
    const payload = {
      firstName: 'RegrConv',
      lastName: `ToConvert${uid}`,
      emailAddress: `regr.convert.${uid}@regression.com`,
    };

    cy.createLeadViaApi(payload).then((createResponse) => {
      createdLeadId = createResponse.body.id;
      const leadId = createdLeadId;

      // Act: ejecutar conversión mediante la acción oficial de EspoCRM (Lead/action/convert)
      cy.request({
        method: 'POST',
        url: 'http://localhost:8080/api/v1/Lead/action/convert',
        auth: { user: 'Tomas', pass: 'tomas12345' },
        body: {
          id: leadId,
          records: {
            Contact: {
              firstName: payload.firstName,
              lastName: payload.lastName,
            },
          },
        },
        failOnStatusCode: false,
      }).then((convertResponse) => {
        // Assert: la conversión debe retornar 200
        expect(convertResponse.status).to.equal(200);

        // Capturar IDs de entidades generadas por la conversión para cleanup
        if (convertResponse.body.createdContactId) {
          createdContactId = convertResponse.body.createdContactId;
        }
        if (convertResponse.body.createdAccountId) {
          createdAccountId = convertResponse.body.createdAccountId;
        }

        // Assert: la respuesta directa de la acción debe tener status 'Converted'
        expect(convertResponse.body).to.have.property('status').and.to.equal('Converted');

        // Assert adicional: verificar persistencia en BD consultando el Lead por GET
        cy.request({
          method: 'GET',
          url: `http://localhost:8080/api/v1/Lead/${leadId}`,
          auth: { user: 'Tomas', pass: 'tomas12345' },
        }).then((getResponse) => {
          expect(getResponse.status).to.equal(200);
          expect(getResponse.body.status).to.equal('Converted');
        });
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R5.2 — Invariante de UI: botón Convert existe en Lead no convertido
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión UI] R5.2 — El botón "Convert" está presente en la vista de un Lead con status "New"', () => {
    // Arrange: crear Lead nuevo (no convertido)
    const uid = Date.now();
    const payload = {
      firstName: 'RegrUI',
      lastName: `NotConverted${uid}`,
      emailAddress: `regr.ui.new.${uid}@regression.com`,
      status: 'New',
    };

    cy.createLeadViaApi(payload).then((response) => {
      createdLeadId = response.body.id;

      // Act: visitar la vista de detalle del Lead
      cy.visit(`/#Lead/view/${createdLeadId}`);

      // Assert: el botón Convert debe existir y ser visible para Leads no convertidos
      cy.get('button[data-action="convert"], [data-action="convert"]')
        .should('exist')
        .and('be.visible');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R5.3 — Invariante de UI: botón Convert NO existe en Lead ya convertido
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión UI] R5.3 — El botón "Convert" NO existe en la vista de un Lead con status "Converted"', () => {
    // Arrange: crear Lead directamente con status 'Converted' via API
    const uid = Date.now();
    const payload = {
      firstName: 'RegrUIConv',
      lastName: `AlreadyConverted${uid}`,
      emailAddress: `regr.ui.conv.${uid}@regression.com`,
      status: 'Converted',
    };

    cy.createLeadViaApi(payload).then((response) => {
      createdLeadId = response.body.id;

      // Act: visitar la vista de detalle del Lead convertido
      cy.visit(`/#Lead/view/${createdLeadId}`);

      // Assert: el botón Convert NO debe existir para Leads convertidos
      cy.get('button[data-action="convert"], [data-action="convert"]')
        .should('not.exist');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R5.4 — Contrato de API: campos requeridos para conversión en respuesta GET
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Contrato] R5.4 — El contrato de Lead incluye los campos requeridos de conversión: id, status, firstName, lastName', () => {
    // Arrange: crear Lead con datos completos
    const uid = Date.now();
    const payload = {
      firstName: 'RegrContract',
      lastName: `ConvFields${uid}`,
      emailAddress: `regr.contract.conv.${uid}@regression.com`,
    };

    cy.createLeadViaApi(payload).then((createResponse) => {
      createdLeadId = createResponse.body.id;

      // Act: recuperar el Lead por ID para verificar contrato de GET
      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/v1/Lead/${createdLeadId}`,
        auth: { user: 'Tomas', pass: 'tomas12345' },
      }).then((response) => {
        // Assert: contrato — id existe y es string no vacío
        expect(response.body).to.have.property('id').and.to.be.a('string').and.not.be.empty;

        // Assert: contrato — status existe (campo de control de conversión)
        expect(response.body).to.have.property('status').and.to.be.a('string');

        // Assert: contrato — firstName existe
        expect(response.body).to.have.property('firstName').and.to.be.a('string');

        // Assert: contrato — lastName existe (campo requerido para conversión)
        expect(response.body).to.have.property('lastName').and.to.be.a('string');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R5.5 — Regla de negocio: la vista de conversión es accesible desde el Lead
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R5.5 — La vista de conversión es accesible haciendo clic en Convert desde un Lead válido', () => {
    // Arrange: crear Lead nuevo
    const uid = Date.now();
    const payload = {
      firstName: 'RegrAccess',
      lastName: `ConvView${uid}`,
      emailAddress: `regr.access.${uid}@regression.com`,
      status: 'New',
    };

    cy.createLeadViaApi(payload).then((response) => {
      createdLeadId = response.body.id;

      // Act: visitar la vista de detalle y hacer clic en Convert
      cy.visit(`/#Lead/view/${createdLeadId}`);

      cy.get('button[data-action="convert"], [data-action="convert"]')
        .should('be.visible')
        .click();

      // Assert: la URL incluye '#Lead/convert/' (vista de conversión cargada)
      cy.url().should('include', '#Lead/convert/');

      // Assert: el formulario de conversión tiene el scope de Contact disponible
      cy.get('input.check-scope[data-scope="Contact"]')
        .should('exist');
    });
  });
});
