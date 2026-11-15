// cypress/e2e/andres/F1_case_status_transition.cy.js

/**
 * F1: Validación de Transición de Estados de Casos
 * Integrante: Andrés Bedoya Cano (VyV EspoCRM 2026-2)
 *
 * Principios FIRST:
 *   Fast            - Inicio de sesión acelerado con sesión y token en caché (loginAs).
 *   Independent     - Cada prueba crea y limpia sus propios datos de prueba de forma aislada.
 *   Repeatable      - Sincronización determinista con interceptores de red y aserciones DOM fluidas.
 *   Self-Validating - Resultado PASS/FAIL inequívoco evaluado mediante Fluent Assertions de Chai y Chai-jQuery.
 *   Timely          - Vinculado a la máquina de estados y reglas de transición de soporte técnico.
 *
 * Patrón AAA (Arrange / Act / Assert).
 * Fluent Assertions: Encadenamiento fluido con .should().and() y expect().
 */

describe('F1: Transición de Estados de Casos de Soporte (Andrés Bedoya)', () => {
  let createdCaseIds = [];

  beforeEach(() => {
    // [FIRST - Fast]: Autenticación optimizada para la sesión de Andrés
    cy.loginAs('andres', 'andres12345');
  });

  afterEach(() => {
    // [FIRST - Independent]: Limpieza estricta de registros creados en cada prueba
    createdCaseIds.forEach((id) => {
      cy.deleteEntityViaApi('Case', id);
    });
    createdCaseIds = [];
  });

  it('[Exitoso - UI] Crea un Caso en estado New desde la interfaz gráfica y valida persistencia', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Intercepción de red y preparación de datos
    // -------------------------------------------------------------------------
    const caseName = `Caso Soporte UI ${Date.now()}`;
    cy.intercept('POST', '**/api/v1/Case*').as('saveCase');

    // -------------------------------------------------------------------------
    // ACT: Navegación al formulario y diligenciamiento de campos visibles
    // -------------------------------------------------------------------------
    cy.visit('/#Case/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .and('be.enabled')
      .type(caseName);

    cy.selectOption('priority', 'Normal');

    cy.get('textarea[data-name="description"]')
      .should('be.visible')
      .type('Descripción técnica del caso de prueba E2E.');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Espera de respuesta API y verificación visual en vista de detalle
    // -------------------------------------------------------------------------
    cy.wait('@saveCase').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body).to.have.property('id');
      expect(interception.response.body.status).to.eq('New');
      createdCaseIds.push(interception.response.body.id);
    });

    cy.get('.header-title', { timeout: 10000 })
      .should('be.visible')
      .and('contain', caseName);

    cy.get('.cell[data-name="status"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'New');
  });

  it('[Alternativo - UI] Transiciona un caso existente de New a Assigned asignando responsable', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Crear caso previo en New vía API con responsable para aislar el escenario
    // -------------------------------------------------------------------------
    const initialName = `Caso Para Asignar ${Date.now()}`;
    cy.requestAsAndres({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/Case',
      body: {
        name: initialName,
        status: 'New',
        priority: 'High',
        assignedUserId: '62c52bf3add0f226f',
        assignedUserName: 'Andres Bedoya',
      },
    }).then((res) => {
      expect(res.status).to.eq(200);
      const caseId = res.body.id;
      createdCaseIds.push(caseId);

      cy.intercept('PUT', `**/api/v1/Case/${caseId}*`).as('updateCase');

      // -----------------------------------------------------------------------
      // ACT: Abrir vista de detalle en UI, editar y cambiar estado a Assigned
      // -----------------------------------------------------------------------
      cy.visit(`/#Case/view/${caseId}`);

      cy.get('button[data-action="edit"]', { timeout: 15000 })
        .should('be.visible')
        .click();

      cy.selectOption('status', 'Assigned');

      cy.get('button[data-action="save"]')
        .should('be.visible')
        .click();

      // -----------------------------------------------------------------------
      // ASSERT: Verificación de cambio de estado en la interfaz
      // -----------------------------------------------------------------------
      cy.wait('@updateCase').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.status).to.eq('Assigned');
      });

      cy.get('.cell[data-name="status"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain', 'Assigned');
    });
  });

  it('[Error / Regla de Negocio - UI] Bloquea intento de crear caso directamente en estado Closed', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Formulario de creación
    // -------------------------------------------------------------------------
    const invalidName = `Caso Ilegal Closed ${Date.now()}`;
    cy.intercept('POST', '**/api/v1/Case*').as('attemptInvalidSave');

    // -------------------------------------------------------------------------
    // ACT: Intentar seleccionar Closed en un caso nuevo
    // -------------------------------------------------------------------------
    cy.visit('/#Case/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .type(invalidName);

    cy.selectOption('status', 'Closed');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: El Hook de negocio rechaza la petición con HTTP 400 y alerta visible
    // -------------------------------------------------------------------------
    cy.wait('@attemptInvalidSave').then((interception) => {
      expect(interception.response.statusCode).to.eq(400);
    });

    // En la interfaz se muestra el banner de notificación de error
    cy.get('.notifications-panel, .notification, .alert-danger, .msg', { timeout: 10000 })
      .should('be.visible');
  });

  it('[Validación - UI] Valida campo obligatorio Name en el formulario', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Abrir formulario sin diligenciar campos requeridos
    // -------------------------------------------------------------------------
    cy.visit('/#Case/create');

    // -------------------------------------------------------------------------
    // ACT: Intentar guardar con nombre vacío
    // -------------------------------------------------------------------------
    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .clear();

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: El cliente resalta el campo con error de validación
    // -------------------------------------------------------------------------
    cy.get('.has-error, .cell[data-name="name"].has-error', { timeout: 10000 })
      .should('be.visible');
  });
});
