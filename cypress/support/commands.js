// cypress/support/commands.js

/**
 * Autentica al usuario administrador directamente mediante la API REST de EspoCRM,
 * almacenando los encabezados o tokens de autorizacion requeridos para evitar pasar
 * por el formulario visual de login en cada prueba.
 */
Cypress.Commands.add('loginViaApi', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/App/user`,
    auth: {
      user: Cypress.env('username'),
      pass: Cypress.env('password'),
    },
    failOnStatusCode: false,
  }).then((response) => {
    const token = response.headers['x-auth-token'] || response.headers['x-espo-authorization'] || '';
    window.localStorage.setItem('auth-token', token);
    // Establecer cabecera de autenticacion basica si es requerida por frontend
    const credentials = btoa(`${Cypress.env('username')}:${Cypress.env('password')}`);
    window.localStorage.setItem('auth-credentials', credentials);
  });
});

/**
 * Crea cualquier entidad (Lead, Contact, Opportunity, Meeting) mediante API.
 */
Cypress.Commands.add('createEntityViaApi', (entity, payload) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/${entity}`,
    auth: {
      user: Cypress.env('username'),
      pass: Cypress.env('password'),
    },
    body: payload,
    failOnStatusCode: false,
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
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/${entity}/${id}`,
    auth: {
      user: Cypress.env('username'),
      pass: Cypress.env('password'),
    },
    failOnStatusCode: false,
  });
});

