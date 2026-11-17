import { Given, When, Then, After } from '@badeball/cypress-cucumber-preprocessor';
import { Actor } from '../../screenplay/actor/Actor';
import { BrowseTheWeb } from '../../screenplay/abilities/BrowseTheWeb';
import { CallAnApi } from '../../screenplay/abilities/CallAnApi';
import { LoginAsAndres, NavigateToModule, CreateCaseForm, CreateTaskActivityForm, CreateAccountCompanyForm } from '../../screenplay/tasks/TasksAndres';
import { PageTitleHeader } from '../../screenplay/questions/QuestionsAndres';

let actor;
let cleanEntities = [];

After(() => {
  cleanEntities.forEach(({ entity, id }) => {
    if (id) {
      cy.requestAsAndres({
        method: 'DELETE',
        url: `http://localhost:8080/api/v1/${entity}/${id}`,
      });
    }
  });
  cleanEntities = [];
});

// =========================================================================
// ANTECEDENTES COMUNES
// =========================================================================

Given('que Andres inicia sesión en la plataforma con credenciales válidas', () => {
  actor = Actor.named('Andres')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));
  actor.attemptsTo(LoginAsAndres.withCredentials());
});

Given('navega al módulo de {string}', (moduleName) => {
  actor.attemptsTo(NavigateToModule.named(moduleName));
});

// =========================================================================
// F1: CASE STATUS TRANSITION
// =========================================================================

When('Andres registra un nuevo caso con nombre {string} y estado {string}', (name, status) => {
  const caseName = `${name} ${Date.now()}`;
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Case',
    body: {
      name: caseName,
      status: status,
      priority: 'Normal',
      assignedUserId: '62c52bf3add0f226f',
      assignedUserName: 'Andres Bedoya'
    },
  }).then((res) => {
    expect(res.status).to.eq(200);
    actor.remember('currentCaseId', res.body.id);
    cleanEntities.push({ entity: 'Case', id: res.body.id });
  });
});

When('actualiza el estado del caso a {string}', (targetStatus) => {
  const caseId = actor.recall('currentCaseId');
  cy.requestAsAndres({
    method: 'PUT',
    url: `http://localhost:8080/api/v1/Case/${caseId}`,
    body: {
      status: targetStatus,
      assignedUserId: '62c52bf3add0f226f'
    },
  }).then((res) => {
    expect(res.status).to.eq(200);
    actor.remember('lastStatus', res.body.status);
  });
});

Then('el caso debe reflejar exitosamente su nuevo estado {string}', (expectedStatus) => {
  expect(actor.recall('lastStatus')).to.eq(expectedStatus);
});

When('intenta registrar un caso con nombre vacío', () => {
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Case',
    body: { name: '', status: 'New' },
  }).then((res) => {
    actor.remember('validationErrorStatus', res.status);
  });
});

Then('el sistema debe impedir el guardado y mostrar mensaje de validación', () => {
  const status = actor.recall('validationErrorStatus');
  expect(status).to.be.oneOf([400, 422]);
});

// =========================================================================
// F2: CASE SLA CALCULATION
// =========================================================================

When('Andres registra un caso crítico con prioridad {string} y tipo {string}', (priority, type) => {
  const caseName = `Caso Crítico BDD ${Date.now()}`;
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Case',
    body: { name: caseName, priority, type, status: 'New' },
  }).then((res) => {
    expect(res.status).to.eq(200);
    actor.remember('casePriority', res.body.priority);
    cleanEntities.push({ entity: 'Case', id: res.body.id });
  });
});

Then('el caso debe quedar registrado con prioridad {string} en el sistema', (expectedPriority) => {
  expect(actor.recall('casePriority')).to.eq(expectedPriority);
});

Then('debe visualizarse correctamente en el listado de casos activos', () => {
  cy.visit('/#Case');
  cy.get('#main', { timeout: 15000 }).should('be.visible');
});

When('Andres registra un caso con prioridad {string} y tipo {string}', (priority, type) => {
  const caseName = `Caso Informativo BDD ${Date.now()}`;
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Case',
    body: { name: caseName, priority, type, status: 'New' },
  }).then((res) => {
    expect(res.status).to.eq(200);
    actor.remember('casePriority', res.body.priority);
    cleanEntities.push({ entity: 'Case', id: res.body.id });
  });
});

Then('el caso debe ser clasificado con nivel de servicio estándar', () => {
  expect(actor.recall('casePriority')).to.eq('Low');
});

// =========================================================================
// F3: QUOTE DISCOUNT
// =========================================================================

When('Andres registra una cotización corporativa con monto de {int} USD y etapa {string}', (amount, stage) => {
  const name = `Cotización Corporativa BDD ${Date.now()}`;
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Opportunity',
    body: { name, amount, amountCurrency: 'USD', stage, closeDate: '2026-12-31' },
  }).then((res) => {
    expect(res.status).to.eq(200);
    actor.remember('quoteAmount', res.body.amount);
    cleanEntities.push({ entity: 'Opportunity', id: res.body.id });
  });
});

Then('la cotización debe registrarse con monto de {int} USD', (expectedAmount) => {
  expect(actor.recall('quoteAmount')).to.eq(expectedAmount);
});

Then('el valor debe verse reflejado en la vista de detalle de la venta', () => {
  cy.visit('/#Opportunity');
  cy.get('#main', { timeout: 15000 }).should('be.visible');
});

When('Andres registra una cotización estándar con monto de {int} USD', (amount) => {
  const name = `Cotización Estándar BDD ${Date.now()}`;
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Opportunity',
    body: { name, amount, amountCurrency: 'USD', stage: 'Prospecting', closeDate: '2026-12-31' },
  }).then((res) => {
    expect(res.status).to.eq(200);
    actor.remember('quoteAmount', res.body.amount);
    cleanEntities.push({ entity: 'Opportunity', id: res.body.id });
  });
});

// =========================================================================
// F4: TASK OVERDUE EVALUATION
// =========================================================================

When('Andres programa una tarea {string} con estado {string} y prioridad {string}', (name, status, priority) => {
  const taskName = `${name} ${Date.now()}`;
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Task',
    body: { name: taskName, status, priority, dateEnd: '2026-11-20 18:00:00', assignedUserId: '62c52bf3add0f226f' },
  }).then((res) => {
    expect(res.status).to.eq(200);
    actor.remember('taskCreated', res.body);
    cleanEntities.push({ entity: 'Task', id: res.body.id });
  });
});

Then('la tarea debe crearse exitosamente en el módulo de actividades', () => {
  const task = actor.recall('taskCreated');
  expect(task).to.have.property('id');
});

When('Andres marca como {string} una tarea existente', (status) => {
  const taskName = `Tarea a completar BDD ${Date.now()}`;
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Task',
    body: { name: taskName, status: 'Started', priority: 'High', assignedUserId: '62c52bf3add0f226f' },
  }).then((res) => {
    const taskId = res.body.id;
    cleanEntities.push({ entity: 'Task', id: taskId });
    cy.requestAsAndres({
      method: 'PUT',
      url: `http://localhost:8080/api/v1/Task/${taskId}`,
      body: { status },
    }).then((updateRes) => {
      expect(updateRes.status).to.eq(200);
      actor.remember('taskStatus', updateRes.body.status);
    });
  });
});

Then('la tarea debe quedar registrada como completada sin mora', () => {
  expect(actor.recall('taskStatus')).to.eq('Completed');
});

// =========================================================================
// F5: ACCOUNT DEDUPLICATION
// =========================================================================

When('Andres registra una empresa con nombre único, NIT tributario y sitio web', () => {
  const timestamp = Date.now();
  const payload = {
    name: `Empresa BDD ${timestamp} S.A.S.`,
    sicCode: `NIT-${timestamp}`,
    website: `https://www.bdd${timestamp}.com`,
    type: 'Customer',
  };
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Account',
    body: payload,
  }).then((res) => {
    expect(res.status).to.eq(200);
    actor.remember('accountCreated', res.body);
    cleanEntities.push({ entity: 'Account', id: res.body.id });
  });
});

Then('la cuenta debe ser creada exitosamente con sus datos tributarios', () => {
  const acc = actor.recall('accountCreated');
  expect(acc).to.have.property('id');
  expect(acc).to.have.property('sicCode');
});

Then('debe listarse en el directorio principal de cuentas', () => {
  cy.visit('/#Account');
  cy.get('#main', { timeout: 15000 }).should('be.visible');
});

When('intenta registrar una empresa con el nombre vacío', () => {
  cy.requestAsAndres({
    method: 'POST',
    url: 'http://localhost:8080/api/v1/Account',
    body: { name: '', type: 'Customer' },
  }).then((res) => {
    actor.remember('accountErrorStatus', res.status);
  });
});

Then('el sistema debe impedir el guardado de la cuenta', () => {
  const status = actor.recall('accountErrorStatus');
  expect(status).to.be.oneOf([400, 422]);
});
