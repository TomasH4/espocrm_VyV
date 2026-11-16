// CUR-F4 Consulta y actualización de tasas (GET / PUT /api/v1/CurrencyRate, RateService).
// Funcionalidad solo de API. Escenarios ESC-CUR-F4-01 a 05.
// DEF-CUR-03 y DEF-CUR-04 se corrigieron con TDD (docs/CUR/tdd): estas pruebas verifican la corrección.
import { COP_RATE, statusReason } from '../../support/cur';

describe('CUR-F4 API de tasas de cambio', () => {
  let regular;

  before(() => {
    cy.curCreateRegularUser().then((u) => {
      regular = u;
    });
  });

  beforeEach(() => {
    cy.curSetCopRate(COP_RATE);
  });

  after(() => {
    cy.curSetCopRate(COP_RATE);
    cy.then(() => cy.curDeleteUser(regular && regular.id));
  });

  context('ESC-CUR-F4-01 Consulta según permisos', () => {
    it('CN-CUR-F4-01 (exitoso): el administrador obtiene las tasas', () => {
      cy.curApi('GET', 'CurrencyRate').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.eq({ USD: 1, COP: COP_RATE });
      });
    });

    it('CN-CUR-F4-02 (error): un usuario normal recibe 403', () => {
      cy.curApi('GET', 'CurrencyRate', undefined, { user: regular.user, pass: regular.pass })
        .its('status').should('eq', 403);
    });

    it('CN-CUR-F4-03 (error): sin autenticar recibe 401', () => {
      cy.curApi('GET', 'CurrencyRate', undefined, null).its('status').should('eq', 401);
    });
  });

  context('ESC-CUR-F4-02 Actualización válida', () => {
    it('CN-CUR-F4-04 (exitoso): PUT COP = 0.00026 se refleja en la consulta', () => {
      cy.curApi('PUT', 'CurrencyRate', { COP: 0.00026 }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.eq(true);
      });
      cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', 0.00026);
    });

    it('Valor límite (exitoso): la tasa igual al mínimo 0.0001 se acepta', () => {
      cy.curApi('PUT', 'CurrencyRate', { COP: 0.0001 }).its('status').should('eq', 200);
      cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', 0.0001);
    });
  });

  context('ESC-CUR-F4-03 Valor de tasa inválido', () => {
    const invalidos = [
      { caso: 'CN-CUR-F4-06', valor: -0.5, motivo: 'less than 0.0001' },
      { caso: 'CN-CUR-F4-07 (DEF-CUR-04 corregido)', valor: 0, motivo: 'less than 0.0001' },
      { caso: 'Valor límite 0.00009', valor: 0.00009, motivo: 'less than 0.0001' },
      { caso: 'CN-CUR-F4-08 (DEF-CUR-03 corregido)', valor: 'abc', motivo: 'must be a number' },
      { caso: 'Booleano true (hallado en el TDD)', valor: true, motivo: 'must be a number' },
    ];

    invalidos.forEach(({ caso, valor, motivo }) => {
      it(`${caso} (error): COP = ${JSON.stringify(valor)} → 400 y la tasa no cambia`, () => {
        cy.curApi('PUT', 'CurrencyRate', { COP: valor }).then((response) => {
          expect(response.status).to.eq(400);
          expect(statusReason(response)).to.contain(motivo);
        });
        cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', COP_RATE);
      });
    });
  });

  context('ESC-CUR-F4-04 Monedas no aplicables', () => {
    const omitidos = [
      { caso: 'CN-CUR-F4-09', body: { EUR: 0.9 }, motivo: 'EUR no está en la lista' },
      { caso: 'CN-CUR-F4-10', body: { USD: 2 }, motivo: 'USD es la moneda base' },
    ];

    omitidos.forEach(({ caso, body, motivo }) => {
      it(`${caso} (alternativo): ${motivo} → 200 sin cambios`, () => {
        cy.curApi('PUT', 'CurrencyRate', body).its('status').should('eq', 200);
        cy.curApi('GET', 'CurrencyRate').its('body').should('deep.eq', { USD: 1, COP: COP_RATE });
      });
    });
  });

  it('CN-CUR-F4-11 (error, OBS-CUR-06 resuelta por el TDD): un cuerpo que no es objeto → 400', () => {
    // EspoCRM convierte [1,2] en {"list":[1,2]}; validateRate() rechaza el valor no numérico de 'list'.
    cy.curApi('PUT', 'CurrencyRate', [1, 2]).then((response) => {
      expect(response.status).to.eq(400);
      expect(statusReason(response)).to.contain('must be a number');
    });
    cy.curApi('GET', 'CurrencyRate').its('body').should('deep.eq', { USD: 1, COP: COP_RATE });
  });

  context('ESC-CUR-F4-05 Actualización sin permisos', () => {
    it('CN-CUR-F4-12 (error): un usuario normal recibe 403', () => {
      cy.curApi('PUT', 'CurrencyRate', { COP: 0.0003 }, { user: regular.user, pass: regular.pass }).then((response) => {
        expect(response.status, statusReason(response)).to.eq(403);
      });
      cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', COP_RATE);
    });

    it('CN-CUR-F4-13 (error): sin autenticar recibe 401', () => {
      cy.curApi('PUT', 'CurrencyRate', { COP: 0.0003 }, null).its('status').should('eq', 401);
    });
  });
});
