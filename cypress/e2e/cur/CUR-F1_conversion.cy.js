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

    it('CN-CUR-F1-13 (error, DEF-CUR-01 corregido): códigos en minúsculas muestran un error de fórmula legible', () => {
      // Arrange
      cy.visit('/#Admin/formulaSandbox');
      cy.curTypeFormula("output\\print(ext\\currency\\convert(100, 'usd', 'cop'));");
      cy.intercept('POST', '**/Formula/action/run').as('run');

      // Act
      cy.get('button[data-name="run"]').click();

      // Assert: antes era un 500 «Internal server error»; ahora la pantalla explica la causa.
      cy.wait('@run').its('response.statusCode').should('eq', 200);
      cy.get('.field[data-name="errorMessage"]').should('contain.text', "Currency 'usd' is not configured");
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

    const errores = [
      { caso: 'CN-CUR-F1-11', monto: '100', de: 'USD', a: 'EUR', defecto: 'DEF-CUR-01', mensaje: "Currency 'EUR' is not configured" },
      { caso: 'CN-CUR-F1-13', monto: '100', de: 'usd', a: 'cop', defecto: 'DEF-CUR-01', mensaje: "Currency 'usd' is not configured" },
      { caso: 'CN-CUR-F1-17', monto: "'abc'", de: 'USD', a: 'COP', defecto: 'DEF-CUR-02', mensaje: "The amount 'abc' is not a number" },
    ];

    errores.forEach(({ caso, monto, de, a, defecto, mensaje }) => {
      it(`${caso} (error, ${defecto} corregido): error de fórmula controlado «${mensaje}»`, () => {
        // Antes: HTTP 500. Ahora: 200 con isSuccess = false y la causa en el mensaje.
        cy.curConvert(monto, de, a).then((response) => {
          expect(response.status, statusReason(response)).to.eq(200);
          expect(response.body.isSuccess).to.eq(false);
          expect(response.body.message).to.contain(mensaje);
        });
      });
    });
  });
});
