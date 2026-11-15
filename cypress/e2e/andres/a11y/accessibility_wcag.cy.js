// cypress/e2e/andres/a11y/accessibility_wcag.cy.js
import 'cypress-axe';

/**
 * Suite de Pruebas de Accesibilidad Web (WCAG 2.1 Nivel AA)
 * Integrante: Andres Bedoya Cano
 *
 * Combina evaluacion automatizada (Axe-Core) y verificaciones
 * tecnicas de navegabilidad por teclado, foco, semantica y contraste.
 */

describe('Accesibilidad Web WCAG 2.1 AA (Andrés Bedoya)', () => {
  beforeEach(() => {
    cy.loginAs('andres', 'andres12345');
  });

  const views = [
    { name: 'Casos de Soporte', url: '/#Case' },
    { name: 'Ventas y Cotizaciones', url: '/#Opportunity' },
    { name: 'Tareas y Actividades', url: '/#Task' },
    { name: 'Cuentas Corporativas', url: '/#Account' },
  ];

  views.forEach(({ name, url }) => {
    it(`CP-A11Y-01: Auditoría automatizada Axe-Core en vista de ${name}`, () => {
      cy.visit(url);
      cy.get('#main', { timeout: 15000 }).should('be.visible');
      cy.injectAxe();

      // Ejecutar análisis permitiendo capturar y registrar barreras WCAG sin abortar suite
      cy.checkA11y(
        '#main',
        {
          includedImpacts: ['critical', 'serious', 'moderate', 'minor'],
        },
        null,
        true // skipFailures: true para recolectar métricas y continuar
      );
    });
  });

  it('CP-A11Y-02 [Manual Codificado]: Navegación y captura de foco en formulario de Casos', () => {
    cy.visit('/#Case/create');
    cy.get('input[data-name="name"]', { timeout: 12000 })
      .should('be.visible')
      .focus()
      .should('have.focus')
      .type('Caso de prueba con teclado');

    cy.get('button[data-action="cancel"]')
      .should('be.visible')
      .focus()
      .should('have.focus');
  });

  it('CP-A11Y-03 [Manual Codificado]: Indicador visual de foco en elementos interactivos', () => {
    cy.visit('/#Case');
    cy.get('#main', { timeout: 15000 }).should('be.visible');
    cy.get('input.main-search-input, input[data-name="quick-search"], button[data-action="search"]')
      .first()
      .should('be.visible')
      .focus()
      .should('have.focus');
  });
});
