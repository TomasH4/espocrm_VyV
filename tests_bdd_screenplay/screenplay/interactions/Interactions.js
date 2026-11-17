/**
 * Interactions.js
 * 
 * Interacciones atómicas con el DOM para el patrón Screenplay.
 */

export class Navigate {
  constructor(url) {
    this.url = url;
  }

  static to(url) {
    return new Navigate(url);
  }

  performAs(actor) {
    cy.visit(this.url);
  }
}

export class Click {
  constructor(selector, options = {}) {
    this.selector = selector;
    this.options = options;
  }

  static on(selector, options = {}) {
    return new Click(selector, options);
  }

  performAs(actor) {
    cy.get(this.selector).should('be.visible').and('not.be.disabled').click(this.options);
  }
}

export class Fill {
  constructor(selector, text, options = {}) {
    this.selector = selector;
    this.text = text;
    this.options = options;
  }

  static in(selector, text, options = {}) {
    return new Fill(selector, text, options);
  }

  performAs(actor) {
    let val = this.text;
    if (val && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split('-');
      val = `${d}.${m}.${y}`;
    }
    if (val === '' || val === undefined) {
      cy.get(this.selector).should('exist').clear(this.options);
    } else {
      cy.get(this.selector).should('exist').clear(this.options).type(val, this.options);
    }
  }
}

export class TypeField {
  constructor(selector, text) {
    this.selector = selector;
    this.text = text;
  }

  static into(selector, text) {
    return new TypeField(selector, text);
  }

  performAs(actor) {
    let val = this.text;
    if (val && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split('-');
      val = `${d}.${m}.${y}`;
    }
    cy.get(this.selector).should('exist').then(($el) => {
      const el = $el[0];
      el.value = val || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    });
  }
}

export class SelectOption {
  constructor(fieldName, value) {
    this.fieldName = fieldName;
    this.value = value;
  }

  static forField(fieldName, value) {
    return new SelectOption(fieldName, value);
  }

  performAs(actor) {
    cy.selectOption(this.fieldName, this.value);
  }
}

export class CheckScope {
  constructor(scopeName) {
    this.scopeName = scopeName;
  }

  static forEntity(scopeName) {
    return new CheckScope(scopeName);
  }

  performAs(actor) {
    cy.get(`input.check-scope[data-scope="${this.scopeName}"]`)
      .should('exist')
      .check({ force: true });
  }
}

