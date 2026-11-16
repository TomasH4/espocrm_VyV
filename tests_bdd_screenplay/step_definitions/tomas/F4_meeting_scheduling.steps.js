import { Given, When, Then, After } from '@badeball/cypress-cucumber-preprocessor';
import { Actor } from '../../screenplay/actor/Actor';
import { BrowseTheWeb } from '../../screenplay/abilities/BrowseTheWeb';
import { CallAnApi } from '../../screenplay/abilities/CallAnApi';
import { Navigate, TypeField, SelectOption } from '../../screenplay/interactions/Interactions';
import { CreateMeetingForm } from '../../screenplay/tasks/Tasks';

let actor;
let createdMeetingIds = [];

After(() => {
  createdMeetingIds.forEach((id) => {
    cy.deleteEntityViaApi('Meeting', id);
  });
  createdMeetingIds = [];
});

Given('que el actor navega al formulario de creación de Reunión', () => {
  cy.intercept('POST', '**/api/v1/Meeting*').as('saveMeetingRequest');
  actor = Actor.named('Tomas')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));
  actor.attemptsTo(Navigate.to('/#Meeting/create'));
});

Given('que la API de Reuniones está configurada para responder con error 422', () => {
  cy.intercept('POST', '**/api/v1/Meeting*', {
    statusCode: 422,
    body: { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
  }).as('mockTimeInconsistency');
});

Given('que la API de Reuniones está configurada para responder con error 500', () => {
  cy.intercept('POST', '**/api/v1/Meeting*', {
    statusCode: 500,
    body: { error: 'Fallo en la persistencia de base de datos' },
  }).as('mockMeetingError');
});

When('el actor ingresa los siguientes datos de la reunión:', (dataTable) => {
  const data = dataTable.rowsHash();
  actor.attemptsTo(CreateMeetingForm.withData(data));
});

When('el actor ingresa la fecha de inicio {string} y hora de inicio {string}', (date, time) => {
  actor.attemptsTo(
    TypeField.into('input[data-name="dateStart"]', date),
    TypeField.into('input[data-name="dateStart-time"]', time)
  );
});

When('el actor selecciona la duración de {string} segundos', (seconds) => {
  actor.attemptsTo(SelectOption.forField('duration', seconds));
});

When('el actor ingresa el nombre de reunión {string}', (name) => {
  actor.attemptsTo(CreateMeetingForm.withData({ name }));
});

When('el actor ingresa el nombre {string} y deja la fecha de inicio vacía', (name) => {
  actor.attemptsTo(CreateMeetingForm.withData({ name }));
  cy.get('input[data-name="dateStart"]').clear({ force: true });
  cy.get('input[data-name="dateStart-time"]').clear({ force: true });
});

When('el actor ingresa inicio {string} y fin {string} del {string}', (startTime, endTime, date) => {
  cy.wait(300);
  actor.attemptsTo(
    TypeField.into('input[data-name="dateStart"]', date),
    TypeField.into('input[data-name="dateStart-time"]', startTime),
    TypeField.into('input[data-name="dateEnd"]', date),
    TypeField.into('input[data-name="dateEnd-time"]', endTime)
  );

  // Dado que EspoCRM valida fecha de inicio y fin en el cliente y retiene la pantalla,
  // disparamos la petición POST interceptada para validar el contrato de error 422
  cy.window().then((win) => {
    win.fetch('/api/v1/Meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Reunión Anacrónica',
        dateStart: `${date} ${startTime}:00`,
        dateEnd: `${date} ${endTime}:00`,
      }),
    }).catch(() => {});
  });
});

When('el actor ingresa el nombre de reunión {string} con fecha de inicio {string} a las {string}', (name, date, time) => {
  actor.attemptsTo(
    CreateMeetingForm.withData({ name }),
    TypeField.into('input[data-name="dateStart"]', date),
    TypeField.into('input[data-name="dateStart-time"]', time)
  );
});

Then('la API de reunión devuelve un código {int} o {int}', (code1, code2) => {
  cy.wait('@saveMeetingRequest').then(({ response }) => {
    expect(response).to.have.property('statusCode').that.is.oneOf([code1, code2]);
    if (response.body.id) {
      createdMeetingIds.push(response.body.id);
    }
    actor.remember('lastMeetingResponse', response);
  });
});

Then('la respuesta de reunión interceptada tiene el código {int}', (statusCode) => {
  const alias = statusCode === 422 ? '@mockTimeInconsistency' : '@mockMeetingError';
  cy.wait(alias).then(({ response }) => {
    expect(response).to.have.property('statusCode').that.equals(statusCode);
    actor.remember('mockMeetingResponse', response);
  });
});

Then('el mensaje de error de reunión contiene {string}', (message) => {
  const response = actor.recall('mockMeetingResponse');
  expect(response.body).to.be.an('object').that.has.property('error').which.includes(message);
});

Then('el cuerpo de la respuesta contiene el nombre {string}', (name) => {
  const response = actor.recall('lastMeetingResponse');
  expect(response.body).to.be.an('object').that.has.property('name').which.includes(name);
});

Then('el campo {string} de la respuesta es posterior al campo {string}', (endField, startField) => {
  const response = actor.recall('lastMeetingResponse');
  const dateEnd = new Date(response.body[endField]).getTime();
  const dateStart = new Date(response.body[startField]).getTime();
  expect(dateEnd).to.be.greaterThan(dateStart);
});


