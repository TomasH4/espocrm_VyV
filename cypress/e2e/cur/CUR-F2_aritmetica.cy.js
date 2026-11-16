// CUR-F2 Aritmética decimal exacta (CalculatorUtil, bcmath con escala 14).
// Escenarios ESC-CUR-F2-01 a 03. Se ejecuta por la API del Formula Sandbox.
import { COP_RATE } from '../../support/cur';

describe('CUR-F2 Aritmética decimal', () => {
  context('Con COP = 0.00025 (resultados exactos)', () => {
    beforeEach(() => {
      cy.curSetCopRate(COP_RATE);
    });

    it('CN-CUR-F2-01 (exitoso): 0.1 USD se convierte sin error de coma flotante', () => {
      cy.curConvert('0.1', 'USD', 'COP').its('body.output').should('contain', '400.00000000000000');
    });

    it('CN-CUR-F2-02 (exitoso): 0.1 + 0.2 da exactamente 0.3', () => {
      cy.curConvert('0.1 + 0.2', 'USD', 'USD').its('body.output').should('contain', '0.30000000000000');
    });
  });

  context('Con COP = 0.0003 (resultados periódicos)', () => {
    before(() => {
      cy.curSetCopRate(0.0003);
    });

    after(() => {
      cy.curSetCopRate(COP_RATE);
    });

    it('CN-CUR-F2-05 (exitoso): 1 / 0.0003 se corta en 14 decimales', () => {
      cy.curConvert('1', 'USD', 'COP').its('body.output').should('contain', '3333.33333333333333');
    });

    it('CN-CUR-F2-08 (alternativo, OBS-CUR-03): la ida y vuelta no recupera el 1 por el truncamiento', () => {
      cy.curConvert("'3333.33333333333333'", 'COP', 'USD').its('body.output').should('contain', '0.99999999999999');
    });
  });
});
