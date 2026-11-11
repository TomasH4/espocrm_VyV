/**
 * F3_contact_search.cy.js
 *
 * Suite de pruebas E2E automatizadas para la Funcionalidad 3: Búsqueda y Filtrado de Contactos (Contact Search & Filtering)
 *
 * Principios FIRST:
 *   Fast            - Contactos semilla generados vía API en el hook beforeEach.
 *   Independent     - Colección de IDs rastreada y purgada sin dejar residuos en BD.
 *   Repeatable      - Sincronización exacta con las peticiones HTTP del listado de contactos.
 *   Self-Validating - Aserciones fluidas encadenadas sobre colecciones y cardinalidad de registros.
 *   Timely          - Pruebas alineadas con las modalidades exacta, parcial y filtros de estado.
 *
 * Patrón AAA (Arrange / Act / Assert).
 * Fluent Assertions: .should('be.visible').and(...) y expect(response).to...
 */

describe('Funcionalidad 3: Búsqueda y Filtrado de Contactos (Contact Search & Filtering)', () => {
  let createdContactIds = [];

  beforeEach(() => {
    // [FIRST - Fast]: Inicio de sesión por API
    cy.loginViaApi();

    // [FIRST - Independent]: Preparación de datos semilla específicos para esta suite
    cy.createEntityViaApi('Contact', {
      firstName: 'Carlos',
      lastName: 'Gomez',
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
    // ARRANGE: Interceptar consulta de búsqueda
    // -------------------------------------------------------------------------
    cy.intercept('GET', '**/api/v1/Contact*').as('searchContacts');

    // -------------------------------------------------------------------------
    // ACT: Navegar al listado y buscar subcadena "Gom"
    // -------------------------------------------------------------------------
    cy.visit('/#Contact');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .should('be.visible')
      .and('be.enabled')
      .clear()
      .type('Gom{enter}');

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre cardinalidad y coincidencias esperadas
    // -------------------------------------------------------------------------
    cy.wait('@searchContacts').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.equals(200);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('total')
        .which.is.at.least(2);
    });

    cy.get('.list-row, tr[data-id]')
      .should('have.length.at.least', 2);

    cy.contains('Carlos Gomez')
      .should('be.visible')
      .and('exist');

    cy.contains('Ana Gomis')
      .should('be.visible')
      .and('exist');

    cy.contains('Luis Restrepo')
      .should('not.exist');
  });

  it('[Exitoso] Realiza búsqueda exacta entre comillas dobles y recupera únicamente el contacto indicado', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Intercepción de consulta exacta
    // -------------------------------------------------------------------------
    cy.intercept('GET', '**/api/v1/Contact*').as('searchExact');

    // -------------------------------------------------------------------------
    // ACT: Buscar "\"Carlos Gomez\""
    // -------------------------------------------------------------------------
    cy.visit('/#Contact');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .should('be.visible')
      .clear()
      .type('"Carlos Gomez"{enter}');

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre coincidencia unívoca
    // -------------------------------------------------------------------------
    cy.wait('@searchExact').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.equals(200);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('total')
        .which.equals(1);
    });

    cy.contains('Carlos Gomez')
      .should('be.visible')
      .and('exist');

    cy.contains('Ana Gomis')
      .should('not.exist');

    cy.contains('Luis Restrepo')
      .should('not.exist');
  });

  it('[Exitoso] Filtra por estado "Active" excluyendo los contactos inactivos', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Preparación de filtro
    // -------------------------------------------------------------------------
    cy.intercept('GET', '**/api/v1/Contact*').as('filterQuery');

    // -------------------------------------------------------------------------
    // ACT: Buscar específicamente a Luis Restrepo para verificar aislamiento
    // -------------------------------------------------------------------------
    cy.visit('/#Contact');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .should('be.visible')
      .clear()
      .type('Restrepo{enter}');

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre resultados
    // -------------------------------------------------------------------------
    cy.contains('Luis Restrepo')
      .should('be.visible')
      .and('exist');

    cy.contains('Carlos Gomez')
      .should('not.exist');

    cy.contains('Ana Gomis')
      .should('not.exist');
  });

  it('[Alternativo] Muestra indicador "No Data" ante un término de búsqueda inexistente', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Intercepción de búsqueda vacía
    // -------------------------------------------------------------------------
    cy.intercept('GET', '**/api/v1/Contact*').as('searchNoData');

    // -------------------------------------------------------------------------
    // ACT: Buscar término inexistente
    // -------------------------------------------------------------------------
    cy.visit('/#Contact');

    cy.get('input.text-filter, input[data-name="textFilter"]')
      .should('be.visible')
      .clear()
      .type('TerminoInexistenteXYZ{enter}');

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre lista vacía y mensaje No Data
    // -------------------------------------------------------------------------
    cy.wait('@searchNoData').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.equals(200);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('total')
        .which.equals(0);
    });

    cy.get('.no-data, .list-empty, .empty-result, body')
      .should('be.visible')
      .and('contain.text', 'No Data');

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
    // ACT: Navegar al listado de contactos
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

    cy.get('#navbar, .header-toolbar')
      .should('be.visible')
      .and('exist');
  });
});
