/**
 * QuestionsAndres.js
 * 
 * Consultas sobre el estado de la UI bajo el patrón Screenplay para Andrés Bedoya.
 */
export class PageTitleHeader {
  static value() {
    return new PageTitleHeader();
  }

  answeredBy(actor) {
    return cy.get('.page-header, .header-title', { timeout: 10000 });
  }
}

export class NotificationMessage {
  static displayed() {
    return new NotificationMessage();
  }

  answeredBy(actor) {
    return cy.get('.notify, .alert, .message', { timeout: 8000 });
  }
}

export class DetailViewTitle {
  static text() {
    return new DetailViewTitle();
  }

  answeredBy(actor) {
    return cy.get('.record .title, .detail .header-title', { timeout: 10000 });
  }
}
