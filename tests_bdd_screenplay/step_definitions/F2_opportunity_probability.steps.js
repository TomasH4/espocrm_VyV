import { Given, When, Then, After } from '@badeball/cypress-cucumber-preprocessor';
import { Actor } from '../screenplay/actor/Actor';
import { BrowseTheWeb } from '../screenplay/abilities/BrowseTheWeb';
import { CallAnApi } from '../screenplay/abilities/CallAnApi';
import { Navigate, Click, Fill, SelectOption } from '../screenplay/interactions/Interactions';
import { Login, CreateOpportunityForm } from '../screenplay/tasks/Tasks';
import { CurrentUrl } from '../screenplay/questions/Questions';

let actor;
let createdOpportunityIds = [];

After(() => {
  createdOpportunityIds.forEach((id) => {
    cy.deleteEntityViaApi('Opportunity', id);
  });
  createdOpportunityIds = [];
});

Given('que el actor navega al formulario de creación de Oportunidad', () => {
  cy.intercept('POST', '**/api/v1/Opportunity*').as('opportunityPost');
  actor = Actor.named('Tomas')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));
  actor.attemptsTo(Navigate.to('/#Opportunity/create'));
});

Given('que existe una Oportunidad creada en etapa {string} con probabilidad {int}', (stage, probability) => {
  cy.createEntityViaApi('Opportunity', {
    name: 'Oportunidad Transición Etapa BDD',
    stage,
    amount: 15000,
    closeDate: '2026-12-31',
    probability,
  }).then(({ body }) => {
    createdOpportunityIds.push(body.id);
    actor.remember('existingOpportunityId', body.id);
  });
});

Given('que la API de Oportunidad está configurada para responder con error 500', () => {
  cy.intercept('POST', '**/api/v1/Opportunity*', {
    statusCode: 500,
    body: { error: 'Fallo en la persistencia de base de datos' },
  }).as('mockOpportunityError');
});

When('el actor ingresa el nombre de oportunidad {string}', (name) => {
  actor.attemptsTo(Fill.in('input[data-name="name"]', name));
});

When('el actor ingresa el monto {string} y la fecha de cierre {string}', (amount, closeDate) => {
  actor.attemptsTo(
    Fill.in('input[data-name="amount"]', amount),
    Fill.in('input[data-name="closeDate"]', closeDate)
  );
});

When('el actor selecciona la etapa {string}', (stage) => {
  actor.attemptsTo(SelectOption.forField('stage', stage));
});

When('el actor navega a la edición de dicha oportunidad', () => {
  const optId = actor.recall('existingOpportunityId');
  cy.intercept('PUT', `**/api/v1/Opportunity/${optId}*`).as('opportunityPut');
  actor.attemptsTo(Navigate.to(`/#Opportunity/edit/${optId}`));
});

When('el actor ingresa el nombre {string} con monto {string} y fecha {string} en etapa {string}', (name, amount, closeDate, stage) => {
  actor.attemptsTo(
    Fill.in('input[data-name="name"]', name),
    Fill.in('input[data-name="amount"]', amount),
    Fill.in('input[data-name="closeDate"]', closeDate),
    SelectOption.forField('stage', stage)
  );
});

Then('la API de oportunidad devuelve un código {int} o {int}', (code1, code2) => {
  cy.wait('@opportunityPost').then(({ response }) => {
    expect(response).to.have.property('statusCode').that.is.oneOf([code1, code2]);
    if (response.body.id) {
      createdOpportunityIds.push(response.body.id);
    }
    actor.remember('lastOpportunityResponse', response);
  });
});

Then('la API de actualización de oportunidad devuelve un código {int} o {int}', (code1, code2) => {
  cy.wait('@opportunityPut').then(({ response }) => {
    expect(response).to.have.property('statusCode').that.is.oneOf([code1, code2]);
    if (response.body.id) {
      createdOpportunityIds.push(response.body.id);
    }
    actor.remember('lastOpportunityResponse', response);
  });
});

Then('la respuesta de oportunidad interceptada tiene el código {int}', (statusCode) => {
  cy.wait('@mockOpportunityError').then(({ response }) => {
    expect(response).to.have.property('statusCode').that.equals(statusCode);
  });
});

Then('el cuerpo de la respuesta contiene la probabilidad {int}', (prob) => {
  const response = actor.recall('lastOpportunityResponse');
  expect(response.body).to.be.an('object').that.has.property('probability').which.equals(prob);
});

Then('el campo {string} muestra el valor {string}', (field, value) => {
  cy.get(`[data-name="${field}"], .field-${field}`)
    .should('be.visible')
    .and('contain.text', value);
});

