/**
 * @file R-CUR_monedas_tasas.regression.cy.js
 * @description Pruebas de REGRESIÓN del módulo Moneda y tasas de cambio (CUR, Alejandro Bustamante)
 * después de corregir DEF-CUR-03 y DEF-CUR-04 con TDD en RateService::set() (docs/CUR/tdd).
 *
 * Selección por riesgo del cambio:
 *   RC-A  Casos que pasan por la validación nueva de set()             → deben cambiar a 400 o mantenerse.
 *   RC-B  Casos que dependen de una tasa escrita por la API            → conversión y aritmética intactas.
 *   RC-C  Flujos vecinos que el cambio no debe tocar                   → permisos y sincronización por hooks.
 *
 * Ejecutar: npx cypress run --spec "cypress/e2e/regression/R-CUR_monedas_tasas.regression.cy.js" --config trashAssetsBeforeRuns=false
 */
import { COP_RATE, statusReason } from '../../support/cur';

describe('[Regresión] CUR Moneda y tasas de cambio', () => {
  let regular;
  let copId;

  before(() => {
    cy.curCreateRegularUser().then((u) => {
      regular = u;
    });
    cy.curCopRecordId().then((id) => {
      copId = id;
    });
  });

  beforeEach(() => {
    cy.curSetCopRate(COP_RATE);
  });

  after(() => {
    cy.curSetCopRate(COP_RATE);
    cy.then(() => cy.curDeleteUser(regular && regular.id));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RC-A — Validación de tasas en PUT /CurrencyRate (código modificado)
  // ─────────────────────────────────────────────────────────────────────────
  context('RC-A Validación de tasas (código modificado)', () => {
    const rechazos = [
      { id: 'R-CUR.A1', caso: 'CN-CUR-F4-07', body: { COP: 0 }, motivo: 'less than 0.0001' },
      { id: 'R-CUR.A2', caso: 'CN-CUR-F4-08', body: { COP: 'abc' }, motivo: 'must be a number' },
      { id: 'R-CUR.A3', caso: 'TDD ciclo 2', body: { COP: true }, motivo: 'must be a number' },
      { id: 'R-CUR.A4', caso: 'Valor límite', body: { COP: 0.00009 }, motivo: 'less than 0.0001' },
      { id: 'R-CUR.A5', caso: 'CN-CUR-F4-11', body: [1, 2], motivo: 'must be a number' },
      { id: 'R-CUR.A6', caso: 'CN-CUR-F4-06', body: { COP: -0.5 }, motivo: 'less than 0.0001' },
    ];

    rechazos.forEach(({ id, caso, body, motivo }) => {
      it(`[Regresión Corrección] ${id} — ${caso}: ${JSON.stringify(body)} → 400 y la tasa no cambia`, () => {
        cy.curApi('PUT', 'CurrencyRate', body).then((response) => {
          expect(response.status, statusReason(response)).to.eq(400);
          expect(statusReason(response)).to.contain(motivo);
        });
        cy.curApi('GET', 'CurrencyRate').its('body').should('deep.eq', { USD: 1, COP: COP_RATE });
      });
    });

    it('[Regresión Contrato] R-CUR.A7 — CN-CUR-F4-04: una tasa válida se guarda y se consulta', () => {
      cy.curApi('PUT', 'CurrencyRate', { COP: 0.00026 }).its('body').should('eq', true);
      cy.curApi('GET', 'CurrencyRate').its('body').should('deep.eq', { USD: 1, COP: 0.00026 });
    });

    it('[Regresión Contrato] R-CUR.A8 — Valor límite 0.0001 se acepta', () => {
      cy.curApi('PUT', 'CurrencyRate', { COP: 0.0001 }).its('status').should('eq', 200);
      cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', 0.0001);
    });

    it('[Regresión Contrato] R-CUR.A9 — CN-CUR-F4-09/10: EUR y la base USD se omiten sin error', () => {
      cy.curApi('PUT', 'CurrencyRate', { EUR: 0.9, USD: 2 }).its('status').should('eq', 200);
      cy.curApi('GET', 'CurrencyRate').its('body').should('deep.eq', { USD: 1, COP: COP_RATE });
    });

    it('[Regresión Contrato] R-CUR.A10 — Un texto numérico se sigue aceptando', () => {
      cy.curApi('PUT', 'CurrencyRate', { COP: '0.0003' }).its('status').should('eq', 200);
      cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', 0.0003);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RC-B — Conversión con tasas escritas por la API (consumidores del cambio)
  // ─────────────────────────────────────────────────────────────────────────
  context('RC-B Conversión con tasas escritas por la API', () => {
    it('[Regresión Integración] R-CUR.B1 — CN-CUR-F1-01: con COP = 0.00025, 100 USD = 400000 COP', () => {
      cy.curConvert('100', 'USD', 'COP').its('body.output').should('contain', '400000.00000000000000');
    });

    it('[Regresión Integración] R-CUR.B2 — CN-CUR-F2-05: tras PUT COP = 0.0003, 1 USD = 3333.33333333333333 COP', () => {
      cy.curSetCopRate(0.0003);
      cy.curConvert('1', 'USD', 'COP').its('body.output').should('contain', '3333.33333333333333');
    });

    it('[Regresión Integración] R-CUR.B3 — Un PUT rechazado no deja una tasa que rompa la conversión', () => {
      // Antes de la corrección, {"COP":0} se guardaba y la conversión a COP fallaba (división por cero).
      cy.curApi('PUT', 'CurrencyRate', { COP: 0 });
      cy.curConvert('100', 'USD', 'COP').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.output).to.contain('400000.00000000000000');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RC-C — Flujos vecinos que no deben cambiar
  // ─────────────────────────────────────────────────────────────────────────
  context('RC-C Flujos vecinos', () => {
    it('[Regresión Seguridad] R-CUR.C1 — CN-CUR-F4-02/12: el usuario normal sigue recibiendo 403', () => {
      const auth = { user: regular.user, pass: regular.pass };

      cy.curApi('GET', 'CurrencyRate', undefined, auth).its('status').should('eq', 403);
      cy.curApi('PUT', 'CurrencyRate', { COP: 0.0003 }, auth).its('status').should('eq', 403);
    });

    it('[Regresión Seguridad] R-CUR.C2 — CN-CUR-F4-03/13: sin autenticar sigue siendo 401', () => {
      cy.curApi('GET', 'CurrencyRate', undefined, null).its('status').should('eq', 401);
      cy.curApi('PUT', 'CurrencyRate', { COP: 0.0003 }, null).its('status').should('eq', 401);
    });

    it('[Regresión Integración] R-CUR.C3 — CN-CUR-F5-03: editar la tasa vigente por el registro sigue sincronizando', () => {
      cy.curApi(
        'GET',
        `CurrencyRecordRate?maxSize=20&orderBy=date&order=desc&where[0][type]=equals&where[0][attribute]=recordId&where[0][value]=${copId}`
      ).then((response) => {
        const entry = (response.body.list || []).find((r) => parseFloat(r.rate) === COP_RATE);

        expect(entry, 'tasa vigente de COP').to.exist;
        cy.curApi('PUT', `CurrencyRecordRate/${entry.id}`, { rate: '0.0002' }).its('status').should('eq', 200);
      });
      cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', 0.0002);
    });
  });
});
