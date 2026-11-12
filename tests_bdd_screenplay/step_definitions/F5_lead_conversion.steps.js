import { Given, When, Then, After } from '@badeball/cypress-cucumber-preprocessor';
import { Actor } from '../screenplay/actor/Actor';
import { BrowseTheWeb } from '../screenplay/abilities/BrowseTheWeb';
import { CallAnApi } from '../screenplay/abilities/CallAnApi';
import { Navigate, Click, CheckScope } from '../screenplay/interactions/Interactions';

let actor;
let createdLeadIds = [];
let createdContactIds = [];
let createdAccountIds = [];

After(() => {
  createdLeadIds.forEach((id) => cy.deleteEntityViaApi('Lead', id));
  createdContactIds.forEach((id) => cy.deleteEntityViaApi('Contact', id));
  createdAccountIds.forEach((id) => cy.deleteEntityViaApi('Account', id));
  createdLeadIds = [];
  createdContactIds = [];
  createdAccountIds = [];
});

Given('que existe un Lead corporativo con nombre único, empresa y estado {string}', (status) => {
  actor = Actor.named('Tomas')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));

  const uid = Math.floor(100000 + Math.random() * 900000);
  const b2bLead = {
    firstName: `Carlos${uid}`,
    lastName: `Gómez${uid}`,
    emailAddress: `cgomez${uid}@empresavyv.com`,
    phoneNumber: `+57300${uid}1`,
    accountName: `Empresa Gómez ${uid} S.A.`,
    status,
  };

  cy.createLeadViaApi(b2bLead).then(({ body }) => {
    createdLeadIds.push(body.id);
    actor.remember('leadId', body.id);
    actor.remember('accountName', b2bLead.accountName);
    actor.remember('email', b2bLead.emailAddress);
  });
});

Given('que existe un Lead persona natural con nombre único y sin empresa', () => {
  actor = Actor.named('Tomas')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));

  const uid = Math.floor(100000 + Math.random() * 900000);
  const b2cLead = {
    firstName: `Laura${uid}`,
    lastName: `Mora${uid}`,
    emailAddress: `lmora${uid}@personavyv.com`,
    phoneNumber: `+57310${uid}1`,
    accountName: null,
    status: 'New',
  };

  cy.createLeadViaApi(b2cLead).then(({ body }) => {
    createdLeadIds.push(body.id);
    actor.remember('leadId', body.id);
  });
});

Given('que existe un Lead con email único en estado {string}', (status) => {
  actor = Actor.named('Tomas')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));

  const uid = Math.floor(100000 + Math.random() * 900000);
  const fullLead = {
    firstName: `Pedro${uid}`,
    lastName: `Sánchez${uid}`,
    emailAddress: `pedro${uid}@empresavyv.com`,
    phoneNumber: `+57320${uid}1`,
    status,
  };

  cy.createLeadViaApi(fullLead).then(({ body }) => {
    createdLeadIds.push(body.id);
    actor.remember('leadId', body.id);
    actor.remember('email', fullLead.emailAddress);
  });
});

Given('que existe un Lead con estado {string}', (status) => {
  actor = Actor.named('Tomas')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));

  const uid = Math.floor(100000 + Math.random() * 900000);
  cy.createLeadViaApi({
    firstName: `Lead${uid}`,
    lastName: `YaConvertido${uid}`,
    status,
  }).then(({ body }) => {
    createdLeadIds.push(body.id);
    actor.remember('leadId', body.id);
  });
});

Given('que existe un Lead activo con nombre único', () => {
  actor = Actor.named('Tomas')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));

  const uid = Math.floor(100000 + Math.random() * 900000);
  cy.createLeadViaApi({
    firstName: `Transaccional${uid}`,
    lastName: `FalloRollback${uid}`,
    status: 'New',
  }).then(({ body }) => {
    createdLeadIds.push(body.id);
    actor.remember('leadId', body.id);
  });
});

Given('que la API de conversión de Lead está interceptada', () => {
  cy.intercept('POST', '**/api/v1/Lead/action/convert*').as('convertLeadAction');
});

Given('que la API de conversión está configurada para responder con error 500', () => {
  cy.intercept('POST', '**/api/v1/Lead/action/convert*', {
    statusCode: 500,
    body: { error: 'Fallo en la transaccion de conversion del Lead' },
  }).as('mockConvertError');
});

When('el actor navega a la vista del Lead', () => {
  const leadId = actor.recall('leadId');
  actor.attemptsTo(Navigate.to(`/#Lead/view/${leadId}`));
});

When('el actor hace clic en el botón "Convert"', () => {
  actor.attemptsTo(Click.on('button[data-action="convert"]'));
});

When('el actor marca los checkboxes de {string} y {string}', (scope1, scope2) => {
  cy.url().should('include', '#Lead/convert/');
  actor.attemptsTo(
    CheckScope.forEntity(scope1),
    CheckScope.forEntity(scope2)
  );
});

When('el actor marca únicamente el checkbox de {string}', (scope) => {
  cy.url().should('include', '#Lead/convert/');
  actor.attemptsTo(CheckScope.forEntity(scope));
  cy.get('body').then(($body) => {
    const accountCheckbox = $body.find('input.check-scope[data-scope="Account"]');
    if (accountCheckbox.length && accountCheckbox.is(':checked')) {
      cy.wrap(accountCheckbox).uncheck({ force: true });
    }
  });
});

When('el actor marca el checkbox de {string}', (scope) => {
  cy.url().should('include', '#Lead/convert/');
  actor.attemptsTo(CheckScope.forEntity(scope));
});

When('el actor hace clic en el botón de confirmación "Convert"', () => {
  actor.attemptsTo(Click.on('.button-container button[data-action="convert"]'));
});

Then('la API de conversión devuelve un código {int} o {int}', (code1, code2) => {
  cy.wait('@convertLeadAction').then(({ response }) => {
    expect(response).to.have.property('statusCode').that.is.oneOf([code1, code2]);
    if (response.body.createdContactId) {
      createdContactIds.push(response.body.createdContactId);
    }
    if (response.body.createdAccountId) {
      createdAccountIds.push(response.body.createdAccountId);
    }
    actor.remember('convertResponse', response);
  });
});

Then('el cuerpo de la respuesta no contiene un "createdAccountId"', () => {
  const response = actor.recall('convertResponse');
  expect(response.body).to.be.an('object').that.satisfies((b) => !b.createdAccountId);
});

Then('la respuesta de conversión interceptada tiene el código {int}', (statusCode) => {
  cy.wait('@mockConvertError').then(({ response }) => {
    expect(response).to.have.property('statusCode').that.equals(statusCode);
    actor.remember('mockConvertResponse', response);
  });
});

Then('el mensaje de error de conversión contiene {string}', (message) => {
  const response = actor.recall('mockConvertResponse');
  expect(response.body).to.be.an('object').that.has.property('error').which.includes(message);
});

Then('el Lead muestra el estado {string}', (status) => {
  cy.get('[data-name="status"], .field-status, body')
    .should('be.visible')
    .and('contain.text', status);
});

Then('la página muestra el nombre de la empresa del Lead', () => {
  const accountName = actor.recall('accountName');
  cy.get('body').should('be.visible').and('contain.text', accountName);
});

Then('la página muestra el email del Lead convertido', () => {
  const email = actor.recall('email');
  cy.get('body').should('be.visible').and('contain.text', email);
});

Then('el botón "Convert" no existe en la vista del Lead', () => {
  cy.get('button[data-action="convert"]').should('not.exist');
});

