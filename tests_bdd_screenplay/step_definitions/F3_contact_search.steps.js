import { Given, When, Then, After } from '@badeball/cypress-cucumber-preprocessor';
import { Actor } from '../screenplay/actor/Actor';
import { BrowseTheWeb } from '../screenplay/abilities/BrowseTheWeb';
import { CallAnApi } from '../screenplay/abilities/CallAnApi';
import { Navigate } from '../screenplay/interactions/Interactions';
import { SearchContact } from '../screenplay/tasks/Tasks';
import { ContactList } from '../screenplay/questions/Questions';

let actor;
let createdContactIds = [];

After(() => {
  createdContactIds.forEach((id) => {
    cy.deleteEntityViaApi('Contact', id);
  });
  createdContactIds = [];
});

Given('que existen los siguientes contactos semilla en el sistema:', (dataTable) => {
  actor = Actor.named('Tomas')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));

  const contacts = dataTable.hashes();
  contacts.forEach((contact) => {
    cy.createEntityViaApi('Contact', contact).then(({ body }) => {
      if (body && body.id) {
        createdContactIds.push(body.id);
      }
    });
  });
});

Given('que el actor navega al listado de Contactos', () => {
  actor.attemptsTo(Navigate.to('/#Contact'));
});

When('el actor navega al listado de Contactos', () => {
  actor.attemptsTo(Navigate.to('/#Contact'));
});

Given('que la API de Contactos está configurada para responder con error 500', () => {
  cy.intercept('GET', '**/api/v1/Contact*', {
    statusCode: 500,
    body: { error: 'Fallo en la ejecucion de la consulta de base de datos' },
  }).as('mockSearchError');
});

When('el actor busca el término {string}', (term) => {
  actor.attemptsTo(SearchContact.withTerm(term));
});

Then('la lista muestra al menos {int} resultados', (minCount) => {
  ContactList.rows().should('have.length.at.least', minCount);
});

Then('la lista contiene el contacto {string}', (contactName) => {
  cy.contains(new RegExp(contactName.replace('ó', '[oó]'), 'i'), { timeout: 8000 })
    .should('be.visible')
    .and('exist');
});

Then('la lista no contiene el contacto {string}', (contactName) => {
  cy.contains(new RegExp(contactName.replace('ó', '[oó]'), 'i'))
    .should('not.exist');
});

Then('la lista muestra el mensaje {string}', (message) => {
  ContactList.emptyIndicator().should('be.visible').and('contain.text', message);
});

Then('la lista no contiene ninguna fila de resultados', () => {
  ContactList.rows().should('not.exist');
});

Then('la respuesta de contactos interceptada tiene el código {int}', (statusCode) => {
  cy.wait('@mockSearchError').then(({ response }) => {
    expect(response).to.have.property('statusCode').that.equals(statusCode);
    actor.remember('mockSearchResponse', response);
  });
});

Then('el mensaje de error de contactos contiene {string}', (message) => {
  const response = actor.recall('mockSearchResponse');
  expect(response.body).to.be.an('object').that.has.property('error').which.includes(message);
});

