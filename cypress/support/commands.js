// cypress/support/commands.js

/**
 * Autentica al usuario en EspoCRM utilizando cy.session() para cachear la sesión
 * (cookies y localStorage) entre pruebas y archivos de especificación, cumpliendo
 * con el principio FIRST (Fast) al evitar renderizados repetidos de login.
 */
Cypress.Commands.add('loginViaApi', () => {
  cy.env(['apiUrl', 'username', 'password']).then((env) => {
    const username = env.username || 'Tomas';
    const password = env.password || 'tomas12345';

    cy.session(
      `session-${username}`,
      () => {
        cy.visit('/');
        cy.get('#field-userName', { timeout: 10000 }).should('be.visible').type(username);
        cy.get('#field-password').should('be.visible').type(password);
        cy.get('#btn-login').should('be.visible').and('not.be.disabled').click();
        cy.get('#main, .navbar', { timeout: 15000 }).should('be.visible');
        cy.get('#login').should('not.exist');
      },
      {
        cacheAcrossSpecs: true,
      }
    );
  });
});

/**
 * Crea cualquier entidad (Lead, Contact, Opportunity, Meeting) mediante API.
 */
Cypress.Commands.add('createEntityViaApi', (entity, payload) => {
  return cy.env(['apiUrl', 'username', 'password']).then((env) => {
    const apiUrl = env.apiUrl || 'http://localhost:8080/api/v1';
    const username = env.username || 'Tomas';
    const password = env.password || 'tomas12345';

    return cy.request({
      method: 'POST',
      url: `${apiUrl}/${entity}`,
      auth: {
        user: username,
        pass: password,
      },
      body: payload,
      failOnStatusCode: false,
    });
  });
});

/**
 * Crea un Lead via API (util para preparacion rapida en Arrange).
 */
Cypress.Commands.add('createLeadViaApi', (payload) => {
  return cy.createEntityViaApi('Lead', payload);
});

/**
 * Elimina una entidad por su ID via API (util para limpieza estricta en afterEach).
 */
Cypress.Commands.add('deleteEntityViaApi', (entity, id) => {
  if (!id) return;
  cy.env(['apiUrl', 'username', 'password']).then((env) => {
    const apiUrl = env.apiUrl || 'http://localhost:8080/api/v1';
    const username = env.username || 'Tomas';
    const password = env.password || 'tomas12345';

    cy.request({
      method: 'DELETE',
      url: `${apiUrl}/${entity}/${id}`,
      auth: {
        user: username,
        pass: password,
      },
      failOnStatusCode: false,
    });
  });
});

/**
 * Selecciona una opción en un campo select/enum compatible con Selectize.js de EspoCRM.
 */
Cypress.Commands.add('selectOption', (fieldName, value) => {
  cy.get(`select[data-name="${fieldName}"]`).then(($select) => {
    if ($select[0].selectize) {
      $select[0].selectize.setValue(value);
    } else {
      cy.wrap($select).select(value, { force: true });
    }
    cy.wrap($select).trigger('change', { force: true });
  });
});
