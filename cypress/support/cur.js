// cypress/support/cur.js
// Proyecto VyV 2026-2 — Módulo Moneda y tasas de cambio (CUR, Alejandro Bustamante).
// Comandos propios del módulo. Se importan desde cada spec de cypress/e2e/cur para no modificar
// cypress/support/commands.js, que es compartido por el equipo.
//
// Credenciales: se usan curUser/curPassword si están definidas (CYPRESS_curUser, CYPRESS_curPassword);
// si no, el usuario administrador de cypress.config.js (username/password). No se escriben aquí.

/** Tasa de COP con la que quedó el entorno tras la caja negra; cada spec la restablece (FIRST: repetible). */
export const COP_RATE = 0.00025;

function apiConfig() {
  return cy.env(['apiUrl', 'username', 'password', 'curUser', 'curPassword']).then((env) => ({
    url: env.apiUrl || 'http://localhost:8080/api/v1',
    user: env.curUser || env.username,
    pass: env.curPassword || env.password,
  }));
}

/**
 * Petición a la API de EspoCRM sin fallar por el código de estado.
 * auth: 'admin' (por defecto), null (sin autenticar) o {user, pass}.
 */
Cypress.Commands.add('curApi', (method, path, body, auth = 'admin') => {
  return apiConfig().then((cfg) => {
    const options = { method, url: `${cfg.url}/${path}`, failOnStatusCode: false };

    if (body !== undefined) {
      options.body = body;
    }

    if (auth === 'admin') {
      options.auth = { user: cfg.user, pass: cfg.pass };
    } else if (auth) {
      options.auth = auth;
    }

    return cy.request(options);
  });
});

/** Ejecuta una fórmula como lo hace el Formula Sandbox (POST /Formula/action/run). */
Cypress.Commands.add('curFormula', (expression) => {
  return cy.curApi('POST', 'Formula/action/run', { expression });
});

/** Convierte con ext\currency\convert y devuelve la respuesta de la API. */
Cypress.Commands.add('curConvert', (amountExpr, from, to) => {
  const args = [amountExpr, `'${from}'`].concat(to ? [`'${to}'`] : []).join(', ');

  return cy.curFormula(`output\\print(ext\\currency\\convert(${args}));`);
});

/** Deja la tasa de COP del día en el valor indicado. */
Cypress.Commands.add('curSetCopRate', (rate = COP_RATE) => {
  return cy.curApi('PUT', 'CurrencyRate', { COP: rate }).its('status').should('eq', 200);
});

/** Motivo de un error de EspoCRM: cabecera X-Status-Reason o cuerpo JSON. */
export function statusReason(response) {
  const header = response.headers['x-status-reason'];

  if (header) {
    return header;
  }

  return typeof response.body === 'string' ? response.body : JSON.stringify(response.body || '');
}

/**
 * Crea un usuario normal (sin roles) para los casos de permisos y devuelve sus credenciales.
 * La contraseña se genera en cada ejecución y el usuario se borra con curDeleteUser.
 */
Cypress.Commands.add('curCreateRegularUser', () => {
  const suffix = `${Date.now()}`.slice(-8);
  const userName = `cur_regular_${suffix}`;
  const pass = `Cur-${Math.random().toString(36).slice(2, 10)}-Aa9!`;

  return cy
    .curApi('POST', 'User', {
      userName,
      lastName: `CUR Regular ${suffix}`,
      type: 'regular',
      isActive: true,
      password: pass,
      passwordConfirm: pass,
    })
    .then((response) => {
      expect(response.status, `crear usuario normal: ${statusReason(response)}`).to.eq(200);

      return { id: response.body.id, user: userName, pass };
    });
});

Cypress.Commands.add('curDeleteUser', (id) => {
  if (id) {
    cy.curApi('DELETE', `User/${id}`);
  }
});

/** Id del registro de moneda COP (Administration › Currencies). */
Cypress.Commands.add('curCopRecordId', () => {
  return cy
    .curApi('GET', 'CurrencyRecord?maxSize=50')
    .then((response) => {
      const cop = (response.body.list || []).find((r) => r.code === 'COP');

      expect(cop, 'registro de moneda COP').to.exist;

      return cop.id;
    });
});

/** Escribe un script en el editor ace del Formula Sandbox. */
Cypress.Commands.add('curTypeFormula', (script) => {
  cy.get('.field[data-name="script"] .ace_editor', { timeout: 15000 })
    .should('be.visible')
    .then(($editor) => {
      $editor[0].env.editor.setValue(script, 1);
    });
});
