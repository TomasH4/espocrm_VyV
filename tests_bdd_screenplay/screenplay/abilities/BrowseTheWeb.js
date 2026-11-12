/**
 * BrowseTheWeb.js
 * 
 * Habilidad (Ability) que permite al Actor interactuar directamente con la interfaz gráfica web usando Cypress.
 */
export class BrowseTheWeb {
  static using(cyInstance) {
    return new BrowseTheWeb(cyInstance);
  }

  constructor(cyInstance) {
    this.cy = cyInstance || cy;
  }
}

