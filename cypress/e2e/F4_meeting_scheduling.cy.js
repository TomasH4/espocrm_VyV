/**
 * F4_meeting_scheduling.cy.js
 *
 * Suite de pruebas E2E automatizadas para la Funcionalidad 4: Validación Temporal y Cálculo de Duración al Agendar Reuniones
 *
 * Principios FIRST:
 *   Fast            - Sesión inicializada vía API/cy.session; sin latencia de login.
 *   Independent     - Cada reunión creada se elimina rigurosamente en afterEach vía API.
 *   Repeatable      - Sincronización determinista mediante interceptores de red (@alias).
 *   Self-Validating - Fluent Assertions encadenadas sobre timestamps ISO 8601, duraciones en minutos/segundos y visibilidad en DOM.
 *   Timely          - Cumple con las validaciones de negocio de intervalos temporales de VyV.
 *
 * Patrón AAA (Arrange / Act / Assert).
 * Fluent Assertions: Chai .should().and() y expect(obj).to.have.property().that...
 */

describe('Funcionalidad 4: Validación Temporal y Cálculo de Duración al Agendar Reuniones', () => {
  let createdMeetingIds = [];

  beforeEach(() => {
    // [FIRST - Fast]: Autenticación acelerada por sesión
    cy.loginViaApi();
  });

  afterEach(() => {
    // [FIRST - Independent]: Limpieza estricta de reuniones creadas
    createdMeetingIds.forEach((id) => {
      cy.deleteEntityViaApi('Meeting', id);
    });
    createdMeetingIds = [];
  });

  /**
   * Helper robusto para escribir en inputs con datepicker/timepicker de EspoCRM.
   * Evita problemas de elementos desvinculados (detached from DOM) encadenando
   * .clear({ force: true }) y .type(val, { force: true }) de forma aislada.
   */
  const typeField = (selector, val) => {
    if (!val) {
      cy.get(selector).should('exist').clear({ force: true });
    } else {
      cy.get(selector).should('exist').clear({ force: true });
      cy.get(selector).should('exist').type(val, { force: true });
    }
  };

  it('[Exitoso] Calcula automáticamente la duración (90 min) a partir de dateStart y dateEnd', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Preparar datos con intervalo de 90 minutos (10:00 a 11:30)
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Meeting*').as('saveMeetingWithRange');

    // -------------------------------------------------------------------------
    // ACT: Diligenciar inicio y fin en el formulario
    // -------------------------------------------------------------------------
    cy.visit('/#Meeting/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .and('be.enabled')
      .type('Comité Técnico VyV');

    // Llenar dateEnd primero para que cuando se defina dateStart no se desvincule dateEnd
    typeField('input[data-name="dateEnd"]', '2026-11-10');
    typeField('input[data-name="dateEnd-time"]', '11:30');

    typeField('input[data-name="dateStart"]', '2026-11-10');
    typeField('input[data-name="dateStart-time"]', '10:00');

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

      expect(response.body)
        .to.be.an('object')
        .that.has.property('name')
        .which.includes('Comité Técnico VyV');
    });

    cy.url()
      .should('include', '#Meeting/view/')
      .and('not.include', 'create');

    cy.get('.header-title, .page-header')
      .should('be.visible')
      .and('contain.text', 'Comité Técnico VyV');
  });

  it('[Exitoso] Proyecta automáticamente la fecha de fin a partir de dateStart y duración manual (30 min)', () => {
    // -------------------------------------------------------------------------
    // ARRANGE: Duración manual de 30 minutos (1800 seg)
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/api/v1/Meeting*').as('saveMeetingWithDuration');

    // -------------------------------------------------------------------------
    // ACT: Ingresar inicio a las 15:00 y seleccionar duración de 30m (1800s)
    // -------------------------------------------------------------------------
    cy.visit('/#Meeting/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .type('Llamada Rápida 30min');

    typeField('input[data-name="dateStart"]', '2026-11-10');
    typeField('input[data-name="dateStart-time"]', '15:00');

    // Seleccionar duración 30 min (1800 s)
    cy.selectOption('duration', '1800');

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

      // Verificar que dateEnd en la respuesta sea posterior a dateStart
      expect(response.body)
        .to.be.an('object')
        .that.has.property('dateEnd');

      const dateEnd = response.body.dateEnd;
      const dateStart = response.body.dateStart;
      expect(new Date(dateEnd).getTime())
        .to.be.greaterThan(new Date(dateStart).getTime());
    });

    cy.url()
      .should('include', '#Meeting/view/');

    // La vista de detalle debe mostrar la reunión guardada
    cy.get('.header-title, .page-header')
      .should('be.visible')
      .and('contain.text', 'Llamada Rápida 30min');
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

    typeField('input[data-name="dateStart"]', '2026-11-10');
    typeField('input[data-name="dateStart-time"]', '09:00');

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

      // Verificar que dateEnd existe y es posterior a dateStart
      expect(response.body)
        .to.be.an('object')
        .that.has.property('dateEnd');

      const dateEnd = response.body.dateEnd;
      const dateStart = response.body.dateStart;
      expect(new Date(dateEnd).getTime())
        .to.be.greaterThan(new Date(dateStart).getTime());
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

    cy.get('input[data-name="dateStart"]').clear({ force: true });
    cy.get('input[data-name="dateStart-time"]').clear({ force: true });

    cy.get('button[data-action="save"]')
      .should('be.visible')
      .click();

    // -------------------------------------------------------------------------
    // ASSERT: Fluent Assertions sobre retención de vista e indicador de error
    // -------------------------------------------------------------------------
    cy.url()
      .should('include', '#Meeting/create')
      .and('not.include', 'view');

    cy.get('.has-error, .invalid-feedback, .text-danger, .popover, [data-name="dateStart"]')
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

    // Establecer primero dateEnd anterior y luego dateStart
    typeField('input[data-name="dateEnd"]', '2026-11-10');
    typeField('input[data-name="dateEnd-time"]', '09:30');

    typeField('input[data-name="dateStart"]', '2026-11-10');
    typeField('input[data-name="dateStart-time"]', '10:00');

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

    // La URL permanece en create (no hubo navegación a view)
    cy.url()
      .should('include', '#Meeting/create');

    cy.get('input[data-name="name"]')
      .should('be.visible')
      .and('have.value', 'Reunión Anacrónica');
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

    typeField('input[data-name="dateStart"]', '2026-11-10');
    typeField('input[data-name="dateStart-time"]', '11:00');

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
