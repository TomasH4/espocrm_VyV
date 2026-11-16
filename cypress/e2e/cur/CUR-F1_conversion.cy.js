// CUR-F1 Conversión de montos entre monedas (Converter + ext\currency\convert).
// Escenarios ESC-CUR-F1-01 a 05 del Excel «Casos y Escenarios EspoCRM».
// Entorno: USD base, COP = 0.00025 USD (se restablece antes de cada prueba).
import { COP_RATE, statusReason } from '../../support/cur';

describe('CUR-F1 Conversión de monedas', () => {
  beforeEach(() => {
    cy.curSetCopRate(COP_RATE);
  });

  context('Interfaz: Formula Sandbox', () => {
    beforeEach(() => {
      cy.loginViaApi();
    });

    it('CN-CUR-F1-01 (exitoso): convierte 100 USD a COP y muestra el resultado', () => {
      // Arrange
      cy.visit('/#Admin/formulaSandbox');
      cy.curTypeFormula("output\\print(ext\\currency\\convert(100, 'USD', 'COP'));");
      cy.intercept('POST', '**/Formula/action/run').as('run');

      // Act
      cy.get('button[data-name="run"]').click();

      // Assert
      cy.wait('@run').its('response.statusCode').should('eq', 200);
      cy.get('.field[data-name="output"]').should('contain.text', '400000.00000000000000');
    });

    it('CN-CUR-F1-13 (error, DEF-CUR-01 abierto): códigos en minúsculas terminan en error interno', () => {
      // Arrange
      cy.visit('/#Admin/formulaSandbox');
      cy.curTypeFormula("output\\print(ext\\currency\\convert(100, 'usd', 'cop'));");
      cy.intercept('POST', '**/Formula/action/run').as('run');

      // Act
      cy.get('button[data-name="run"]').click();

      // Assert: comportamiento actual documentado (500 en lugar de un error de fórmula legible)
      cy.wait('@run').its('response.statusCode').should('eq', 500);
    });
  });

  context('API: POST /Formula/action/run', () => {
    const exitosos = [
      { caso: 'CN-CUR-F1-01', monto: '100', de: 'USD', a: 'COP', esperado: '400000.00000000000000' },
      { caso: 'CN-CUR-F1-02', monto: '400000', de: 'COP', a: 'USD', esperado: '100.00000000000000' },
    ];

    exitosos.forEach(({ caso, monto, de, a, esperado }) => {
      it(`${caso} (exitoso): ${monto} ${de} → ${a} = ${esperado}`, () => {
        cy.curConvert(monto, de, a).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.isSuccess).to.eq(true);
          expect(response.body.output).to.contain(esperado);
        });
      });
    });

    it('CN-CUR-F1-03 (alternativo): misma moneda devuelve el mismo monto', () => {
      cy.curConvert('100', 'USD', 'USD').then((response) => {
        expect(response.status).to.eq(200);
        expect(parseFloat(response.body.output)).to.eq(100);
      });
    });

    it('CN-CUR-F1-06 (valor límite): monto 0 da 0', () => {
      cy.curConvert('0', 'USD', 'COP').then((response) => {
        expect(response.status).to.eq(200);
        expect(parseFloat(response.body.output)).to.eq(0);
      });
    });

    const defectos = [
      { caso: 'CN-CUR-F1-11', monto: '100', de: 'USD', a: 'EUR', defecto: 'DEF-CUR-01', motivo: 'moneda no configurada' },
      { caso: 'CN-CUR-F1-13', monto: '100', de: 'usd', a: 'cop', defecto: 'DEF-CUR-01', motivo: 'códigos en minúsculas' },
      { caso: 'CN-CUR-F1-17', monto: "'abc'", de: 'USD', a: 'COP', defecto: 'DEF-CUR-02', motivo: 'monto no numérico' },
    ];

    defectos.forEach(({ caso, monto, de, a, defecto, motivo }) => {
      it(`${caso} (error, ${defecto} abierto): ${motivo} responde 500`, () => {
        // Comportamiento actual documentado; al corregir el defecto debe esperarse un error de fórmula (200, isSuccess false) o 400.
        cy.curConvert(monto, de, a).then((response) => {
          expect(response.status, statusReason(response)).to.eq(500);
        });
      });
    });
  });
});
