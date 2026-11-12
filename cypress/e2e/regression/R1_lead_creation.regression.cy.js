/**
 * @file R1_lead_creation.regression.cy.js
 * @description Pruebas de REGRESIÓN para la creación de Leads en EspoCRM.
 * Verifica contratos de API, invariantes de UI y reglas de negocio
 * que no deben cambiar entre versiones.
 *
 * Ejecutar: npx cypress run --spec "cypress/e2e/regression/R1_lead_creation.regression.cy.js"
 */

describe('[Regresión] Funcionalidad 1: Creación de Lead', () => {
  // IDs de entidades creadas para limpiar en afterEach
  let createdLeadId = null;

  beforeEach(() => {
    // Autenticar via API antes de cada test
    cy.loginViaApi();
  });

  afterEach(() => {
    // Limpiar entidades creadas para mantener independencia entre tests
    if (createdLeadId) {
      cy.deleteEntityViaApi('Lead', createdLeadId);
      createdLeadId = null;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R1.1 — Contrato de API: campos obligatorios en respuesta de creación
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Contrato] R1.1 — La respuesta de creación de Lead incluye los campos id, name y status', () => {
    // Arrange: payload mínimo con email único para evitar colisiones
    const uid = Date.now();
    const payload = {
      firstName: 'Reg',
      lastName: 'Test',
      emailAddress: `reg.test.${uid}@regression.com`,
    };

    // Act: crear Lead via comando custom
    cy.createLeadViaApi(payload).then((response) => {
      // Guardar ID para limpieza en afterEach
      createdLeadId = response.body.id;

      // Assert: contrato de respuesta — id debe existir y ser string
      expect(response.body).to.have.property('id').and.to.be.a('string').and.not.be.empty;

      // Assert: contrato de respuesta — name debe contener el apellido 'Test'
      expect(response.body).to.have.property('name').and.to.be.a('string');
      expect(response.body.name).to.include('Test');

      // Assert: contrato de negocio — status inicial debe ser 'New'
      expect(response.body).to.have.property('status').and.to.equal('New');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R1.2 — Invariante de UI: formulario de creación renderiza campos requeridos
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión UI] R1.2 — El formulario de creación de Lead renderiza todos los campos requeridos', () => {
    // Arrange + Act: navegar al formulario de creación
    cy.visit('/#Lead/create');

    // Assert: campo firstName visible
    cy.get('input[data-name="firstName"]')
      .should('exist')
      .and('be.visible');

    // Assert: campo lastName visible (campo requerido crítico)
    cy.get('input[data-name="lastName"]')
      .should('exist')
      .and('be.visible');

    // Assert: campo email visible (selector compatible con EspoCRM)
    cy.get('input[data-name="emailAddress"], input.email-address')
      .first()
      .should('exist')
      .and('be.visible');

    // Assert: botón Save visible y habilitado
    cy.get('button[data-action="save"]')
      .should('exist')
      .and('be.visible')
      .and('not.be.disabled');

    // Assert: URL contiene '#Lead/create' (invariante de enrutamiento)
    cy.url().should('include', '#Lead/create');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R1.3 — Regla de negocio: Lead sin apellido no persiste
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R1.3 — Un Lead sin apellido no se guarda y el formulario permanece en create', () => {
    // Arrange: navegar al formulario
    cy.visit('/#Lead/create');

    // Act: ingresar firstName, limpiar lastName y guardar
    cy.get('input[data-name="firstName"]').type('SinApellido');
    cy.get('input[data-name="lastName"]').clear();
    cy.get('button[data-action="save"]').click();

    // Assert: la URL sigue en #Lead/create (no navegó a view)
    cy.url().should('include', '#Lead/create');

    // Assert: el botón Save sigue visible (formulario no cerrado)
    cy.get('button[data-action="save"]')
      .should('exist')
      .and('be.visible');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R1.4 — Invariante de negocio: status por defecto es "New"
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión UI] R1.4 — El campo status de un Lead recién creado via API es "New" por defecto', () => {
    // Arrange: payload con identificador único
    const uid = Date.now();
    const payload = {
      firstName: 'Default',
      lastName: `StatusTest${uid}`,
      emailAddress: `default.status.${uid}@regression.com`,
    };

    // Act: crear Lead y verificar status en la respuesta directa de API
    cy.createLeadViaApi(payload).then((response) => {
      createdLeadId = response.body.id;

      // Assert: el status devuelto por la API es exactamente 'New'
      expect(response.body.status).to.equal('New');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R1.5 — Contrato de API: consultar un Lead inexistente retorna 404
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión API] R1.5 — Consultar un Lead con ID inexistente retorna código 404 Not Found', () => {
    // Arrange + Act: intentar obtener un Lead con ID aleatorio inexistente
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/api/v1/Lead/id-inexistente-999999',
      auth: { user: 'Tomas', pass: 'tomas12345' },
      failOnStatusCode: false,
    }).then((response) => {
      // Assert: contrato REST invariante — entidad no encontrada responde 404
      expect(response.status).to.equal(404);
    });
  });
});
