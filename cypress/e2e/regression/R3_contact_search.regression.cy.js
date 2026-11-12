/**
 * @file R3_contact_search.regression.cy.js
 * @description Pruebas de REGRESIÓN para la búsqueda de Contactos en EspoCRM.
 * Verifica contratos de API del endpoint de Contactos, invariantes del
 * componente de búsqueda de UI y reglas de negocio de recuperación.
 *
 * Ejecutar: npx cypress run --spec "cypress/e2e/regression/R3_contact_search.regression.cy.js"
 */

describe('[Regresión] Funcionalidad 3: Búsqueda de Contacto', () => {
  // ID del contacto creado para limpiar en afterEach
  let createdContactId = null;

  beforeEach(() => {
    // Autenticar via API antes de cada test
    cy.loginViaApi();
  });

  afterEach(() => {
    // Limpiar el contacto creado en el test
    if (createdContactId) {
      cy.deleteEntityViaApi('Contact', createdContactId);
      createdContactId = null;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R3.1 — Contrato de API: estructura de respuesta de listado de Contactos
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Contrato] R3.1 — El endpoint de Contactos responde con estructura { list, total }', () => {
    // Arrange + Act: GET al endpoint de Contactos con paginación mínima
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/api/v1/Contact?maxSize=5',
      auth: { user: 'Tomas', pass: 'tomas12345' },
      failOnStatusCode: false,
    }).then((response) => {
      // Assert: status HTTP 200 (endpoint activo y autenticado)
      expect(response.status).to.equal(200);

      // Assert: contrato de respuesta — debe tener propiedad 'list' como array
      expect(response.body).to.have.property('list').and.to.be.an('array');

      // Assert: contrato de respuesta — debe tener propiedad 'total' como número
      expect(response.body).to.have.property('total').and.to.be.a('number');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R3.2 — Invariante de UI: listado de Contactos tiene campo de búsqueda
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión UI] R3.2 — El listado de Contactos renderiza el campo de búsqueda de texto', () => {
    // Arrange + Act: navegar al listado de Contactos
    cy.visit('/#Contact');

    // Assert: input de búsqueda visible (selector compatible con EspoCRM)
    cy.get('input.text-filter, input[data-name="textFilter"]')
      .first()
      .should('exist')
      .and('be.visible');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R3.3 — Regla de negocio: contacto creado es recuperable por apellido
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R3.3 — Un contacto creado via API es recuperable mediante búsqueda por apellido', () => {
    // Arrange: crear contacto con apellido único y email único
    const uid = Date.now();
    const uniqueLastName = `RegresiónApellido${uid}`;
    const payload = {
      firstName: 'RegrSearch',
      lastName: uniqueLastName,
      emailAddress: `regr.search.${uid}@regression.com`,
    };

    cy.createEntityViaApi('Contact', payload).then((response) => {
      createdContactId = response.body.id;

      // Act: visitar listado y buscar por el uid único del apellido
      cy.visit('/#Contact');

      cy.get('input.text-filter, input[data-name="textFilter"]')
        .first()
        .clear()
        .type(uniqueLastName);

      // Enviar búsqueda con Enter
      cy.get('input.text-filter, input[data-name="textFilter"]')
        .first()
        .type('{enter}');

      // Assert: el UID aparece en los resultados de la lista
      cy.contains(String(uid)).should('be.visible');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R3.4 — Contrato de API: campos requeridos en respuesta de creación de Contact
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Contrato] R3.4 — El contrato de Contact incluye los campos id, firstName y lastName', () => {
    // Arrange: payload con identificador único
    const uid = Date.now();
    const payload = {
      firstName: 'RegrContact',
      lastName: `Apellido${uid}`,
      emailAddress: `regr.contract.${uid}@regression.com`,
    };

    // Act: crear Contact via API
    cy.createEntityViaApi('Contact', payload).then((response) => {
      createdContactId = response.body.id;

      // Assert: contrato — id debe existir y ser string no vacío
      expect(response.body).to.have.property('id').and.to.be.a('string').and.not.be.empty;

      // Assert: contrato — firstName debe coincidir exactamente
      expect(response.body).to.have.property('firstName').and.to.equal('RegrContact');

      // Assert: contrato — lastName debe contener 'Apellido'
      expect(response.body).to.have.property('lastName').and.to.include('Apellido');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R3.5 — Regla de negocio: búsqueda con término inexistente no produce resultados
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R3.5 — Búsqueda con término inexistente no produce resultados y muestra "No Data"', () => {
    // Arrange + Act: buscar un término que no puede existir
    cy.visit('/#Contact');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .first()
      .clear()
      .type('TerminoInexistente_REGRESION_XZQ123');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .first()
      .type('{enter}');

    // Assert: no deben existir filas de datos en la tabla
    cy.get('.list-row, tr[data-id]').should('not.exist');

    // Assert: debe aparecer el texto indicador de lista vacía
    cy.contains('No Data').should('be.visible');
  });
});
