/**
 * @file R4_meeting_scheduling.regression.cy.js
 * @description Pruebas de REGRESIÓN para la programación de Reuniones en EspoCRM.
 * Verifica contratos de API (campos dateStart/dateEnd), invariantes de UI
 * del formulario de creación y reglas de negocio temporales.
 *
 * Ejecutar: npx cypress run --spec "cypress/e2e/regression/R4_meeting_scheduling.regression.cy.js"
 */

describe('[Regresión] Funcionalidad 4: Programación de Reunión', () => {
  // ID de la reunión creada para limpiar en afterEach
  let createdMeetingId = null;
  let currentUserId = '5de9aa69aec7e5837';

  before(() => {
    // Obtener dinámicamente el ID del usuario asignado para la API de Meeting
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/api/v1/App/user',
      auth: { user: 'Tomas', pass: 'tomas12345' },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.body && res.body.user && res.body.user.id) {
        currentUserId = res.body.user.id;
      }
    });
  });

  beforeEach(() => {
    // Autenticar via API antes de cada test
    cy.loginViaApi();
  });

  afterEach(() => {
    // Limpiar la reunión creada para mantener independencia entre tests
    if (createdMeetingId) {
      cy.deleteEntityViaApi('Meeting', createdMeetingId);
      createdMeetingId = null;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R4.1 — Contrato de API: campos dateStart, dateEnd y name en la respuesta
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Contrato] R4.1 — La respuesta de creación de Meeting incluye id, name, dateStart y dateEnd', () => {
    // Arrange: payload de reunión con nombre único y assignedUserId requerido
    const uid = Date.now();
    const payload = {
      name: `RegrMeeting${uid}`,
      dateStart: '2026-12-01 10:00:00',
      dateEnd: '2026-12-01 11:00:00',
      assignedUserId: currentUserId,
    };

    // Act: crear Meeting via API
    cy.createEntityViaApi('Meeting', payload).then((response) => {
      createdMeetingId = response.body.id;

      // Assert: contrato — id existe y es string no vacío
      expect(response.body).to.have.property('id').and.to.be.a('string').and.not.be.empty;

      // Assert: contrato — name incluye el prefijo 'RegrMeeting'
      expect(response.body).to.have.property('name').and.to.include('RegrMeeting');

      // Assert: contrato — dateStart existe (campo temporal obligatorio)
      expect(response.body).to.have.property('dateStart').and.to.exist;

      // Assert: contrato — dateEnd existe (campo temporal obligatorio)
      expect(response.body).to.have.property('dateEnd').and.to.exist;
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R4.2 — Regla de negocio: dateEnd debe ser posterior a dateStart
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R4.2 — La fecha dateEnd de un Meeting debe ser posterior a dateStart', () => {
    // Arrange: crear reunión con duración de 1.5 horas
    const uid = Date.now();
    const payload = {
      name: `RegrMeetingOrder${uid}`,
      dateStart: '2026-12-01 10:00:00',
      dateEnd: '2026-12-01 11:30:00',
      assignedUserId: currentUserId,
    };

    // Act: crear Meeting via API
    cy.createEntityViaApi('Meeting', payload).then((response) => {
      createdMeetingId = response.body.id;

      // Assert: invariante temporal — dateEnd debe ser posterior a dateStart
      const start = new Date(response.body.dateStart);
      const end = new Date(response.body.dateEnd);
      expect(end.getTime()).to.be.greaterThan(start.getTime());
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R4.3 — Invariante de UI: formulario de creación tiene campos requeridos
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión UI] R4.3 — El formulario de creación de Meeting renderiza todos los campos requeridos', () => {
    // Arrange + Act: navegar al formulario de creación de Reunión
    cy.visit('/#Meeting/create');

    // Assert: campo name visible
    cy.get('input[data-name="name"]')
      .should('exist')
      .and('be.visible');

    // Assert: campo dateStart existe (puede no ser visible directamente)
    cy.get('input[data-name="dateStart"]')
      .should('exist');

    // Assert: campo de hora de inicio existe
    cy.get('input[data-name="dateStart-time"]')
      .should('exist');

    // Assert: botón Save visible y habilitado
    cy.get('button[data-action="save"]')
      .should('exist')
      .and('be.visible')
      .and('not.be.disabled');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R4.4 — Regla de negocio: reunión sin fecha de inicio no se guarda
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión Negocio] R4.4 — Una Reunión sin fecha de inicio no navega a la vista de detalle', () => {
    // Arrange: navegar al formulario
    cy.visit('/#Meeting/create');

    // Act: ingresar nombre, limpiar la fecha y hora de inicio, intentar guardar
    cy.get('input[data-name="name"]').type('ReuniónSinFecha');

    // Limpiar campo de fecha de inicio
    cy.get('input[data-name="dateStart"]').clear();

    // Limpiar campo de hora de inicio
    cy.get('input[data-name="dateStart-time"]').clear();

    // Intentar guardar
    cy.get('button[data-action="save"]').click();

    // Assert: la URL sigue en #Meeting/create (no se navegó a view)
    cy.url().should('include', '#Meeting/create');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // R4.5 — Contrato de API: una reunión creada es recuperable por GET /{id}
  // ─────────────────────────────────────────────────────────────────────────
  it('[Regresión API] R4.5 — Una Meeting creada via API es recuperable por GET /api/v1/Meeting/{id}', () => {
    // Arrange: crear reunión única con assignedUserId
    const uid = Date.now();
    const payload = {
      name: `RegrMeetingGet${uid}`,
      dateStart: '2026-12-01 14:00:00',
      dateEnd: '2026-12-01 15:00:00',
      assignedUserId: currentUserId,
    };

    cy.createEntityViaApi('Meeting', payload).then((createResponse) => {
      createdMeetingId = createResponse.body.id;

      // Act: recuperar la reunión por su ID via GET directo
      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/v1/Meeting/${createdMeetingId}`,
        auth: { user: 'Tomas', pass: 'tomas12345' },
        failOnStatusCode: false,
      }).then((getResponse) => {
        // Assert: status 200 (entidad encontrada)
        expect(getResponse.status).to.equal(200);

        // Assert: el ID devuelto coincide con el ID creado
        expect(getResponse.body.id).to.equal(createdMeetingId);
      });
    });
  });
});
