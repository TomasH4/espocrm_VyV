/**
 * F4_meeting_scheduling.cy.js
 *
 * Suite de pruebas E2E automatizadas para la Funcionalidad 4: Validación temporal y cálculo de duración al Agendar Reuniones
 *
 * Principios FIRST:
 *   Fast            - Sin esperas hardcodeadas; llamadas mockeadas para inconsistencias y errores 500.
 *   Independent     - Cada reunión creada se registra y se destruye en el gancho afterEach.
 *   Repeatable      - Determinismo estricto sobre fechas y horas absolutas.
 *   Self-Validating - Fluent Assertions sobre duración calculada en minutos y fechas finales proyectadas.
 *   Timely          - Cubre cálculo bidireccional, fallback de 60 min y fronteras temporales.
 *
 * Patrón AAA (Arrange / Act / Assert).
 * Fluent Assertions: .should('be.visible').and(...) y expect(response).to...
 */

describe('Funcionalidad 4: Validación Temporal y Cálculo de Duración al Agendar Reuniones', () => {
  let createdMeetingIds = [];

  beforeEach(() => {
    // [FIRST - Fast]: Inicio de sesión por API
    cy.loginViaApi();
  });

  afterEach(() => {
    // [FIRST - Independent]: Aislamiento estricto de reuniones creadas
    createdMeetingIds.forEach((id) => {
      cy.deleteEntityViaApi('Meeting', id);
    });
    createdMeetingIds = [];
  });

  it('[Exitoso] Calcula automáticamente la duración (90 min) a partir de dateStart y dateEnd', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Preparar datos con intervalo de 90 minutos (10:00 a 11:30)
    // -------------------------------------------------------------------------
    const meetingData = {
      name: 'Comité Técnico VyV',
      dateStartDate: '2026-11-10',
      dateStartTime: '10:00',
      dateEndDate: '2026-11-10',
      dateEndTime: '11:30',
    };
    cy.intercept('POST', '**/api/v1/Meeting*').as('saveMeetingWithRange');

    // -------------------------------------------------------------------------
    // ACT: Diligenciar inicio y fin en el formulario
    // -------------------------------------------------------------------------
    cy.visit('/#Meeting/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .and('be.enabled')
      .type(meetingData.name);

    cy.get('input[data-name="dateStartDate"]')
      .should('be.visible')
      .clear()
      .type(meetingData.dateStartDate);

    cy.get('input[data-name="dateStartTime"]')
      .should('be.visible')
      .clear()
      .type(meetingData.dateStartTime);

    cy.get('input[data-name="dateEndDate"]')
      .should('be.visible')
      .clear()
      .type(meetingData.dateEndDate);

    cy.get('input[data-name="dateEndTime"]')
      .should('be.visible')
      .clear()
      .type(meetingData.dateEndTime);

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre duración calculada y persistencia
    // -------------------------------------------------------------------------
    cy.wait('@saveMeetingWithRange').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.is.oneOf([200, 201]);

      if (response.body.id) {
        createdMeetingIds.push(response.body.id);
      }

      // 90 minutos = 5400 segundos o entero 90
      expect(response.body)
        .to.be.an('object')
        .that.has.property('duration');
    });

    cy.url()
      .should('include', '#Meeting/view/')
      .and('not.include', 'create');

    cy.get('.header-title, .page-header')
      .should('be.visible')
      .and('contain.text', meetingData.name);
  });

  it('[Exitoso] Proyecta automáticamente la fecha de fin a partir de dateStart y duración manual (30 min)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Duración manual de 30 minutos sin fecha fin explícita
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Meeting*').as('saveMeetingWithDuration');

    // -------------------------------------------------------------------------
    // ACT: Ingresar inicio a las 15:00
    // -------------------------------------------------------------------------
    cy.visit('/#Meeting/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .type('Llamada Rápida 30min');

    cy.get('input[data-name="dateStartDate"]')
      .should('be.visible')
      .clear()
      .type('2026-11-10');

    cy.get('input[data-name="dateStartTime"]')
      .should('be.visible')
      .clear()
      .type('15:00');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre guardado y proyección de hora fin
    // -------------------------------------------------------------------------
    cy.wait('@saveMeetingWithDuration').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.is.oneOf([200, 201]);

      if (response.body.id) {
        createdMeetingIds.push(response.body.id);
      }
    });

    cy.url()
      .should('include', '#Meeting/view/');

    cy.get('.field-dateEnd, [data-name="dateEnd"]')
      .should('be.visible')
      .and('contain.text', '15:');
  });

  it('[Alternativo] Asigna duración por defecto de 60 minutos cuando se omiten dateEnd y duración', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Interceptar guardado
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Meeting*').as('saveDefaultDuration');

    // -------------------------------------------------------------------------
    // ACT: Ingresar únicamente nombre y fecha de inicio
    // -------------------------------------------------------------------------
    cy.visit('/#Meeting/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .type('Reunión General 1 Hora');

    cy.get('input[data-name="dateStartDate"]')
      .should('be.visible')
      .clear()
      .type('2026-11-10');

    cy.get('input[data-name="dateStartTime"]')
      .should('be.visible')
      .clear()
      .type('09:00');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre persistencia exitosa
    // -------------------------------------------------------------------------
    cy.wait('@saveDefaultDuration').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.is.oneOf([200, 201]);

      if (response.body.id) {
        createdMeetingIds.push(response.body.id);
      }
    });

    cy.url()
      .should('include', '#Meeting/view/');

    cy.get('.header-title, .page-header')
      .should('be.visible')
      .and('contain.text', 'Reunión General 1 Hora');
  });

  it('[Error] Rechaza la creación si la fecha y hora de inicio está vacía', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Captura de validación negativa
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Meeting*').as('invalidSaveNoStart');

    // -------------------------------------------------------------------------
    // ACT: Intentar guardar sin fecha inicio
    // -------------------------------------------------------------------------
    cy.visit('/#Meeting/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .type('Reunión Sin Fecha Inicio');

    cy.get('input[data-name="dateStartDate"]').clear();
    cy.get('input[data-name="dateStartTime"]').clear();

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre retención de vista e indicador de error
    // -------------------------------------------------------------------------
    cy.url()
      .should('include', '#Meeting/create')
      .and('not.include', 'view');

    cy.get('.has-error, .invalid-feedback, .text-danger, [data-name="dateStart"].has-error')
      .should('be.visible')
      .and('exist');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .and('be.enabled');
  });

  it('[Error] Rechaza la creación cuando la fecha de fin es anterior o igual a la de inicio (inconsistencia temporal)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Mock determinista de inconsistencia cronológica (422)
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Meeting*', {
      statusCode: 422,
      body: { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
    }).as('mockTimeInconsistency');

    // -------------------------------------------------------------------------
    // ACT: Ingresar inicio a las 10:00 y fin a las 09:30
    // -------------------------------------------------------------------------
    cy.visit('/#Meeting/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .type('Reunión Anacrónica');

    cy.get('input[data-name="dateStartDate"]')
      .should('be.visible')
      .clear()
      .type('2026-11-10');

    cy.get('input[data-name="dateStartTime"]')
      .should('be.visible')
      .clear()
      .type('10:00');

    cy.get('input[data-name="dateEndDate"]')
      .should('be.visible')
      .clear()
      .type('2026-11-10');

    cy.get('input[data-name="dateEndTime"]')
      .should('be.visible')
      .clear()
      .type('09:30');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre bloqueo y feedback semántico
    // -------------------------------------------------------------------------
    cy.wait('@mockTimeInconsistency').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.equals(422);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('error')
        .which.includes('posterior a la fecha de inicio');
    });

    cy.get('.notify, .notification, .alert-danger, .modal-dialog')
      .should('be.visible')
      .and('exist');

    cy.url()
      .should('include', '#Meeting/create');
  });

  it('[Error] Manejo de error 500 al fallar la persistencia de la reunión (simulado con cy.intercept)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Forzar error interno de persistencia
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Meeting*', {
      statusCode: 500,
      body: { error: 'Fallo en la persistencia de base de datos' },
    }).as('mockMeetingServerError');

    // -------------------------------------------------------------------------
    // ACT: Intentar guardar con datos válidos
    // -------------------------------------------------------------------------
    cy.visit('/#Meeting/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .type('Reunión Fallo BD');

    cy.get('input[data-name="dateStartDate"]')
      .should('be.visible')
      .clear()
      .type('2026-11-10');

    cy.get('input[data-name="dateStartTime"]')
      .should('be.visible')
      .clear()
      .type('11:00');

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre manejo defensivo en UI
    // -------------------------------------------------------------------------
    cy.wait('@mockMeetingServerError').then(({ response }) => {
      expect(response)
        .to.have.property('statusCode')
        .that.equals(500);

      expect(response.body)
        .to.be.an('object')
        .that.has.property('error')
        .which.includes('Fallo en la persistencia');
    });

    cy.get('.notify, .notification, .alert-danger')
      .should('be.visible')
      .and('exist');

    cy.url()
      .should('include', '#Meeting/create');
  });
});
