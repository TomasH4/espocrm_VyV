/**
 * Tasks.js
 * 
 * Tareas compuestas de negocio bajo el patrón Screenplay.
 */
import { Navigate, Click, Fill, TypeField, SelectOption, CheckScope } from '../interactions/Interactions';

export class Login {
  static withCredentials() {
    return new Login();
  }

  performAs(actor) {
    cy.loginViaApi();
  }
}

export class CreateLeadForm {
  constructor(data) {
    this.data = data;
  }

  static withData(data) {
    return new CreateLeadForm(data);
  }

  performAs(actor) {
    if (this.data.firstName !== undefined) {
      if (this.data.firstName === '') {
        cy.get('input[data-name="firstName"]').clear();
      } else {
        Fill.in('input[data-name="firstName"]', this.data.firstName).performAs(actor);
      }
    }

    if (this.data.lastName !== undefined) {
      if (this.data.lastName.trim() === '') {
        cy.get('input[data-name="lastName"]').clear().type(this.data.lastName);
      } else {
        Fill.in('input[data-name="lastName"]', this.data.lastName).performAs(actor);
      }
    }

    if (this.data.emailAddress !== undefined || this.data.email !== undefined) {
      const email = this.data.emailAddress || this.data.email;
      Fill.in('input.email-address, input[data-name="emailAddress"]', email).performAs(actor);
    }

    if (this.data.phoneNumber !== undefined) {
      Fill.in('input.phone-number, input[data-name="phoneNumber"]', this.data.phoneNumber).performAs(actor);
    }
  }
}

export class CreateOpportunityForm {
  constructor(data) {
    this.data = data;
  }

  static withData(data) {
    return new CreateOpportunityForm(data);
  }

  performAs(actor) {
    if (this.data.name) {
      Fill.in('input[data-name="name"]', this.data.name).performAs(actor);
    }
    if (this.data.amount) {
      Fill.in('input[data-name="amount"]', this.data.amount).performAs(actor);
    }
    if (this.data.closeDate) {
      Fill.in('input[data-name="closeDate"]', this.data.closeDate).performAs(actor);
    }
    if (this.data.stage) {
      SelectOption.forField('stage', this.data.stage).performAs(actor);
    }
  }
}

export class SearchContact {
  constructor(term) {
    this.term = term;
  }

  static withTerm(term) {
    return new SearchContact(term);
  }

  performAs(actor) {
    cy.get('input.text-filter, input[data-name="textFilter"]')
      .should('be.visible')
      .clear()
      .type(`${this.term}{enter}`);
  }
}

export class CreateMeetingForm {
  constructor(data) {
    this.data = data;
  }

  static withData(data) {
    return new CreateMeetingForm(data);
  }

  performAs(actor) {
    if (this.data.name) {
      Fill.in('input[data-name="name"]', this.data.name).performAs(actor);
    }
    if (this.data.dateEnd) {
      TypeField.into('input[data-name="dateEnd"]', this.data.dateEnd).performAs(actor);
    }
    if (this.data.dateEndTime || this.data.endTime) {
      TypeField.into('input[data-name="dateEnd-time"]', this.data.dateEndTime || this.data.endTime).performAs(actor);
    }
    if (this.data.dateStart) {
      TypeField.into('input[data-name="dateStart"]', this.data.dateStart).performAs(actor);
    }
    if (this.data.dateStartTime || this.data.startTime) {
      TypeField.into('input[data-name="dateStart-time"]', this.data.dateStartTime || this.data.startTime).performAs(actor);
    }
    if (this.data.duration) {
      SelectOption.forField('duration', this.data.duration).performAs(actor);
    }
  }
}

export class ConvertLead {
  constructor(scopes = []) {
    this.scopes = scopes;
  }

  static toScopes(scopes) {
    return new ConvertLead(scopes);
  }

  performAs(actor) {
    this.scopes.forEach(scope => {
      CheckScope.forEntity(scope).performAs(actor);
    });
    Click.on('.button-container button[data-action="convert"]').performAs(actor);
  }
}

