import { Given, When, Then, After } from '@badeball/cypress-cucumber-preprocessor';
import { Actor } from '../screenplay/actor/Actor';
import { BrowseTheWeb } from '../screenplay/abilities/BrowseTheWeb';
import { CallAnApi } from '../screenplay/abilities/CallAnApi';
import { Navigate, Click } from '../screenplay/interactions/Interactions';
import { Login, CreateLeadForm } from '../screenplay/tasks/Tasks';
import { CurrentUrl, PageHeader } from '../screenplay/questions/Questions';

let actor;
let createdLeadIds = [];

After(() => {
  createdLeadIds.forEach((id) => {
    cy.deleteEntityViaApi('Lead', id);
  });
  createdLeadIds = [];
});

Given('que el actor {string} ha iniciado sesión en EspoCRM', (name) => {
  actor = Actor.named(name)
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));
  actor.attemptsTo(Login.withCredentials());
});

Given('que el actor navega al formulario de creación de Lead', () => {
  cy.intercept('POST', '**/api/v1/Lead*').as('saveLeadRequest');
  actor.attemptsTo(Navigate.to('/#Lead/create'));
});

Given('que la API de Lead está configurada para responder con error 500', () => {
  cy.intercept('POST', '**/api/v1/Lead*', {
    statusCode: 500,
    body: { error: 'Fallo en la persistencia de base de datos' },
  }).as('mockServerError');
});

When('el actor ingresa los siguientes datos del Lead:', (dataTable) => {
  const data = dataTable.rowsHash();
  actor.attemptsTo(CreateLeadForm.withData(data));
});

When('el actor ingresa el apellido {string} y deja el email en blanco', (lastName) => {
  actor.attemptsTo(CreateLeadForm.withData({ lastName, email: '' }));
});

When('el actor ingresa solo espacios en blanco en el campo apellido', () => {
  actor.attemptsTo(CreateLeadForm.withData({ firstName: '', lastName: '     ' }));
});

When('el actor ingresa el apellido {string} y el email {string}', (lastName, email) => {
  actor.attemptsTo(CreateLeadForm.withData({ lastName, email }));
});

When('el actor ingresa el apellido {string} y hace clic en "Guardar"', (lastName) => {
  actor.attemptsTo(CreateLeadForm.withData({ lastName }));
  actor.attemptsTo(Click.on('button[data-action="save"]'));
});

When('el actor hace clic en "Guardar"', () => {
  actor.attemptsTo(Click.on('button[data-action="save"]'));
});

Then('la API devuelve un código {int} o {int}', (code1, code2) => {
  cy.wait('@saveLeadRequest').then(({ response }) => {
    expect(response).to.have.property('statusCode').that.is.oneOf([code1, code2]);
    if (response.body && response.body.id) {
      createdLeadIds.push(response.body.id);
    }
    actor.remember('lastResponse', response);
  });
});

Then('el cuerpo de la respuesta contiene el apellido {string}', (lastName) => {
  const response = actor.recall('lastResponse');
  expect(response.body).to.be.an('object').that.has.property('name').which.includes(lastName);
});

Then('la URL contiene {string}', (urlFragment) => {
  CurrentUrl.value().should('include', urlFragment);
});

Then('la URL permanece en {string}', (urlFragment) => {
  CurrentUrl.value().should('include', urlFragment);
});

Then('el encabezado de la página contiene {string}', (title) => {
  PageHeader.text().should('be.visible').and('contain.text', title);
});

Then('el campo de email no contiene el símbolo "@"', () => {
  cy.get('.field-emailAddress, [data-name="emailAddress"]').should('not.contain.text', '@');
});

Then('el formulario muestra un indicador de error para el campo {string}', (field) => {
  cy.get(`.popover, .has-error, .invalid-feedback, .text-danger, [data-name="${field}"]`)
    .should('be.visible')
    .and('exist');
});

Then('el botón "Save" permanece visible', () => {
  cy.get('button[data-action="save"]').should('be.visible');
});

Then('la respuesta interceptada tiene el código {int}', (statusCode) => {
  cy.wait('@mockServerError').then(({ response }) => {
    expect(response).to.have.property('statusCode').that.equals(statusCode);
    actor.remember('mockResponse', response);
  });
});

Then('el mensaje de error contiene {string}', (message) => {
  const response = actor.recall('mockResponse');
  expect(response.body).to.be.an('object').that.has.property('error').which.includes(message);
});

Then('aparece una notificación de error en la interfaz', () => {
  cy.get('.notify, .notification, .alert-danger, .modal-dialog').should('be.visible').and('exist');
});

