/**
 * Questions.js
 * 
 * Consultas sobre el estado del sistema y del DOM para las aserciones de Screenplay.
 */

export class CurrentUrl {
  static value() {
    return cy.url();
  }
}

export class PageHeader {
  static text() {
    return cy.get('.header-title, .page-header, h3');
  }
}

export class FieldValue {
  static of(selector) {
    return cy.get(selector);
  }
}

export class Notification {
  static element() {
    return cy.get('.notify, .notification, .alert-danger, .modal-dialog');
  }
}

export class ContactList {
  static rows() {
    return cy.get('.list-row, tr[data-id]');
  }

  static emptyIndicator() {
    return cy.get('.no-data, .list-empty, .empty-result, body');
  }
}

