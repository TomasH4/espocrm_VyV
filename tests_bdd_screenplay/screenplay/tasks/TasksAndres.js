/**
 * TasksAndres.js
 * 
 * Tareas compuestas de negocio bajo el patrón Screenplay para el alcance de Andrés Bedoya.
 */
import { Navigate, Click, Fill, SelectOption } from '../interactions/Interactions';

export class LoginAsAndres {
  static withCredentials() {
    return new LoginAsAndres();
  }

  performAs(actor) {
    cy.loginAs('andres', 'andres12345');
  }
}

export class NavigateToModule {
  constructor(moduleName) {
    this.moduleName = moduleName;
  }

  static named(moduleName) {
    return new NavigateToModule(moduleName);
  }

  performAs(actor) {
    Navigate.to(`/#${this.moduleName}`).performAs(actor);
    cy.get('#main', { timeout: 15000 }).should('be.visible');
  }
}

export class CreateCaseForm {
  constructor(data) {
    this.data = data;
  }

  static withData(data) {
    return new CreateCaseForm(data);
  }

  performAs(actor) {
    Click.on('button[data-action="create"], a[href="#Case/create"]').performAs(actor);
    cy.get('input[data-name="name"]', { timeout: 10000 }).should('be.visible');

    if (this.data.name !== undefined) {
      Fill.in('input[data-name="name"]', this.data.name).performAs(actor);
    }
    if (this.data.status !== undefined) {
      SelectOption.in('status', this.data.status).performAs(actor);
    }
    if (this.data.priority !== undefined) {
      SelectOption.in('priority', this.data.priority).performAs(actor);
    }

    Click.on('button[data-action="save"]').performAs(actor);
  }
}

export class CreateTaskActivityForm {
  constructor(data) {
    this.data = data;
  }

  static withData(data) {
    return new CreateTaskActivityForm(data);
  }

  performAs(actor) {
    Click.on('button[data-action="create"], a[href="#Task/create"]').performAs(actor);
    cy.get('input[data-name="name"]', { timeout: 10000 }).should('be.visible');

    if (this.data.name !== undefined) {
      Fill.in('input[data-name="name"]', this.data.name).performAs(actor);
    }
    if (this.data.status !== undefined) {
      SelectOption.in('status', this.data.status).performAs(actor);
    }
    if (this.data.priority !== undefined) {
      SelectOption.in('priority', this.data.priority).performAs(actor);
    }

    Click.on('button[data-action="save"]').performAs(actor);
  }
}

export class CreateAccountCompanyForm {
  constructor(data) {
    this.data = data;
  }

  static withData(data) {
    return new CreateAccountCompanyForm(data);
  }

  performAs(actor) {
    Click.on('button[data-action="create"], a[href="#Account/create"]').performAs(actor);
    cy.get('input[data-name="name"]', { timeout: 10000 }).should('be.visible');

    if (this.data.name !== undefined) {
      Fill.in('input[data-name="name"]', this.data.name).performAs(actor);
    }
    if (this.data.sicCode !== undefined) {
      Fill.in('input[data-name="sicCode"]', this.data.sicCode).performAs(actor);
    }
    if (this.data.website !== undefined) {
      Fill.in('input[data-name="website"]', this.data.website).performAs(actor);
    }

    Click.on('button[data-action="save"]').performAs(actor);
  }
}
