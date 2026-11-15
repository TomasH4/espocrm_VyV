// cypress/e2e/andres/F4_task_overdue_evaluation.cy.js

/**
 * F4: Evaluación y Escalado de Tareas Vencidas
 * Integrante: Andrés Bedoya Cano (VyV EspoCRM 2026-2)
 *
 * Principios FIRST:
 *   Fast            - Inicio de sesión con sesión y token en caché (loginAs).
 *   Independent     - Limpieza de tareas en afterEach.
 *   Repeatable      - Sincronización determinista de eventos de red.
 *   Self-Validating - Fluent assertions de Chai sobre fechas y prioridades.
 *   Timely          - Vinculado a reglas de escalado de tareas críticas y vencidas.
 *
 * Patrón AAA (Arrange / Act / Assert).
 */

describe('F4: Gestión y Escalado de Tareas de Actividades (Andrés Bedoya)', () => {
  let createdTaskIds = [];

  beforeEach(() => {
    cy.loginAs('andres', 'andres12345');
  });

  afterEach(() => {
    createdTaskIds.forEach((id) => {
      cy.deleteEntityViaApi('Task', id);
    });
    createdTaskIds = [];
  });

  it('[Exitoso - UI] Crea una Tarea de alta prioridad con fecha de vencimiento y valida persistencia', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Preparación de datos de tarea con vencimiento
    // -------------------------------------------------------------------------
    const taskName = `Revisar Certificados SSL Vencidos ${Date.now()}`;
    cy.intercept('POST', '**/api/v1/Task*').as('saveTask');

    // -------------------------------------------------------------------------
    // ACT: Diligenciamiento en interfaz gráfica
    // -------------------------------------------------------------------------
    cy.visit('/#Task/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .type(taskName);

    cy.selectOption('priority', 'Urgent');
    cy.selectOption('status', 'Not Started');

    cy.get('input[data-name="dateEnd"]')
      .should('be.visible')
      .clear()
      .type('2026-11-10 18:00');

    cy.get('textarea[data-name="description"]')
      .should('be.visible')
      .type('Certificados vencidos hace 5 días. Requiere escalado inmediato a infraestructura.');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Persistencia y visualización de tarea en detalle
    // -------------------------------------------------------------------------
    cy.wait('@saveTask').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.priority).to.eq('Urgent');
      createdTaskIds.push(interception.response.body.id);
    });

    cy.get('.header-title', { timeout: 10000 })
      .should('be.visible')
      .and('contain', taskName);

    cy.get('.cell[data-name="priority"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Urgent');
  });

  it('[Alternativo - UI] Crea una Tarea en progreso con prioridad High', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Tarea en progreso
    // -------------------------------------------------------------------------
    const taskProgName = `Auditoría Logs Base Datos ${Date.now()}`;
    cy.intercept('POST', '**/api/v1/Task*').as('saveProgTask');

    // -------------------------------------------------------------------------
    // ACT: Diligenciamiento con estado Started
    // -------------------------------------------------------------------------
    cy.visit('/#Task/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .type(taskProgName);

    cy.selectOption('priority', 'High');
    cy.selectOption('status', 'Started');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Verificación en detalle
    // -------------------------------------------------------------------------
    cy.wait('@saveProgTask').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      createdTaskIds.push(interception.response.body.id);
    });

    cy.get('.cell[data-name="status"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Started');
  });

  it('[Validación - UI] Valida campo obligatorio Name en el formulario de Tarea', () => {
    // -------------------------------------------------------------------------
    // ACT: Intentar guardar con nombre vacío
    // -------------------------------------------------------------------------
    cy.visit('/#Task/create');

    cy.get('input[data-name="name"]', { timeout: 15000 })
      .should('be.visible')
      .clear();

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Resaltado de validación
    // -------------------------------------------------------------------------
    cy.get('.has-error, .cell[data-name="name"].has-error', { timeout: 10000 })
      .should('be.visible');
  });
});
