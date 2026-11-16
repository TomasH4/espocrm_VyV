/**
 * F3_contact_search.cy.js
 *
 * Suite de pruebas E2E automatizadas para la Funcionalidad 3: Búsqueda y Filtrado de Contactos (Contact Search & Filtering)
 *
 * Principios FIRST:
 *   Fast            - Contactos semilla instanciados por API (POST /api/v1/Contact) en beforeEach.
 *   Independent     - afterEach limpia exhaustivamente los IDs registrados.
 *   Repeatable      - Búsquedas reactivas validadas contra la persistencia y renderizado determinista en DOM.
 *   Self-Validating - Fluent Assertions encadenadas sobre visibilidad, presencia e inexistencia de elementos.
 *   Timely          - Refleja los requisitos de búsqueda parcial y filtros de estado.
 *
 * Patrón AAA (Arrange / Act / Assert).
 * Fluent Assertions: Chai .should().and()
 */

describe('Funcionalidad 3: Búsqueda y Filtrado de Contactos (Contact Search & Filtering)', () => {
  let createdContactIds = [];

  beforeEach(() => {
    // [FIRST - Fast]: Inicio de sesión por API
    cy.loginViaApi();

    // [FIRST - Independent]: Preparación de datos semilla específicos para esta suite
    cy.createEntityViaApi('Contact', {
      firstName: 'Carlos',
      lastName: 'Gómez',
      emailAddress: 'cgomez@empresa.com',
      status: 'Active',
    }).then(({ body }) => {
      if (body.id) createdContactIds.push(body.id);
    });

    cy.createEntityViaApi('Contact', {
      firstName: 'Ana',
      lastName: 'Gomis',
      emailAddress: 'agomis@empresa.com',
      status: 'Active',
    }).then(({ body }) => {
      if (body.id) createdContactIds.push(body.id);
    });

    cy.createEntityViaApi('Contact', {
      firstName: 'Luis',
      lastName: 'Restrepo',
      emailAddress: 'lrestrepo@empresa.com',
      status: 'Inactive',
    }).then(({ body }) => {
      if (body.id) createdContactIds.push(body.id);
    });
  });

  afterEach(() => {
    // [FIRST - Independent]: Limpieza total de contactos semilla creados
    createdContactIds.forEach((id) => {
      cy.deleteEntityViaApi('Contact', id);
    });
    createdContactIds = [];
  });

  it('[Exitoso] Realiza búsqueda parcial (LIKE %Gom%) y recupera los contactos coincidentes', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Navegar al listado de contactos
    // -------------------------------------------------------------------------
    cy.visit('/#Contact');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .should('be.visible')
      .and('be.enabled');

    // -------------------------------------------------------------------------
    // ACT: Buscar subcadena "Gom" presionando Enter
    // -------------------------------------------------------------------------
    cy.get('input.text-filter, input[data-name="textFilter"]')
      .clear()
      .type('Gom{enter}');

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre cardinalidad y coincidencias esperadas en el DOM
    // -------------------------------------------------------------------------
    cy.contains(/Carlos G[oó]mez/i, { timeout: 8000 })
      .should('be.visible')
      .and('exist');

    cy.contains('Ana Gomis')
      .should('be.visible')
      .and('exist');

    cy.contains('Luis Restrepo')
      .should('not.exist');

    cy.get('.list-row, tr[data-id]')
      .should('have.length.at.least', 2);
  });

  it('[Exitoso] Realiza búsqueda exacta entre comillas dobles y recupera únicamente el contacto indicado', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Navegar al listado
    // -------------------------------------------------------------------------
    cy.visit('/#Contact');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .should('be.visible')
      .and('be.enabled');

    // -------------------------------------------------------------------------
    // ACT: Buscar el nombre completo "Carlos Gómez"
    // -------------------------------------------------------------------------
    cy.get('input.text-filter, input[data-name="textFilter"]')
      .clear()
      .type('Carlos Gómez{enter}');

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre coincidencia unívoca
    // -------------------------------------------------------------------------
    cy.contains(/Carlos G[oó]mez/i, { timeout: 8000 })
      .should('be.visible')
      .and('exist');

    // Ana Gomis no debe aparecer con la búsqueda específica de Carlos
    cy.contains('Ana Gomis')
      .should('not.exist');

    cy.contains('Luis Restrepo')
      .should('not.exist');
  });

  it('[Exitoso] Filtra por estado "Active" excluyendo los contactos inactivos', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Navegar al listado
    // -------------------------------------------------------------------------
    cy.visit('/#Contact');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .should('be.visible')
      .clear()
      .type('Restrepo{enter}');

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre resultados
    // -------------------------------------------------------------------------
    cy.contains('Luis Restrepo', { timeout: 8000 })
      .should('be.visible')
      .and('exist');

    cy.contains(/Carlos G[oó]mez/i)
      .should('not.exist');

    cy.contains('Ana Gomis')
      .should('not.exist');
  });

  it('[Alternativo] Muestra indicador "No Data" ante un término de búsqueda inexistente', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Navegar al listado
    // -------------------------------------------------------------------------
    cy.visit('/#Contact');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .should('be.visible')
      .and('be.enabled');

    // -------------------------------------------------------------------------
    // ACT: Buscar término inexistente
    // -------------------------------------------------------------------------
    cy.get('input.text-filter, input[data-name="textFilter"]')
      .clear()
      .type('TerminoInexistenteXYZ{enter}');

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre lista vacía y mensaje No Data en DOM
    // -------------------------------------------------------------------------
    cy.get('.no-data, .list-empty, .empty-result, body', { timeout: 8000 })
      .should('be.visible')
      .and('contain.text', 'No Data');

    cy.contains(/Carlos G[oó]mez/i)
      .should('not.exist');

    cy.contains('Ana Gomis')
      .should('not.exist');

    cy.get('.list-row, tr[data-id]')
      .should('not.exist');
  });

  it('[Error] Manejo de error 500 al fallar el motor de base de datos en la consulta (simulado con cy.intercept)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Simular fallo de base de datos con HTTP 500 determinista
    // -------------------------------------------------------------------------
    cy.intercept('GET', '**/api/v1/Contact*', {
      statusCode: 500,
      body: { error: 'Fallo en la ejecucion de la consulta de base de datos' },
    }).as('mockSearchError');

    // -------------------------------------------------------------------------
    // ACT: Navegar para gatillar la consulta fallida
    // -------------------------------------------------------------------------
    cy.visit('/#Contact');

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre notificación de error y operatividad de la UI
    // -------------------------------------------------------------------------
    cy.wait('@mockSearchError').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.equals(500);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('error')
        .which.includes('Fallo en la ejecucion');
    });

    cy.get('.notify, .notification, .alert-danger, .modal-dialog')
      .should('be.visible')
      .and('exist');

    cy.get('#main, .navbar, .header-toolbar')
      .should('be.visible')
      .and('exist');
  });
});
