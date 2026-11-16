// CUR-F5 Sincronización de tasas vigentes hacia la configuración
// (RecordHooks AfterSave/AfterDelete de CurrencyRecordRate → SyncManager::updateCode).
// Escenarios ESC-CUR-F5-02 a 06. ESC-CUR-F5-04 «sin tasa vigente» (DEF-CUR-05) no se automatiza aquí porque
// obliga a borrar la tasa vigente del entorno; está cubierto por RateSyncTest::testDefCur05SinTasaVigenteEscribeUno.
import { COP_RATE, statusReason } from '../../support/cur';

describe('CUR-F5 Sincronización de tasas', () => {
  let copId;
  const createdRates = [];

  before(() => {
    cy.curCopRecordId().then((id) => {
      copId = id;
    });
  });

  beforeEach(() => {
    cy.curSetCopRate(COP_RATE);
  });

  after(() => {
    createdRates.forEach((id) => cy.curApi('DELETE', `CurrencyRecordRate/${id}`));
    cy.curSetCopRate(COP_RATE);
  });

  /** Tasa vigente de COP: la entrada más reciente con el valor que dejó curSetCopRate. */
  const currentEntry = () =>
    cy
      .curApi('GET', `CurrencyRecordRate?maxSize=20&orderBy=date&order=desc&where[0][type]=equals&where[0][attribute]=recordId&where[0][value]=${copId}`)
      .then((response) => {
        const entry = (response.body.list || []).find((r) => parseFloat(r.rate) === COP_RATE);

        expect(entry, 'tasa vigente de COP').to.exist;

        return entry;
      });

  context('API: hooks de CurrencyRecordRate', () => {
    it('CN-CUR-F5-03 (exitoso): editar la tasa vigente actualiza la configuración', () => {
      currentEntry().then((entry) => {
        cy.curApi('PUT', `CurrencyRecordRate/${entry.id}`, { rate: '0.0002' }).its('status').should('eq', 200);
      });
      cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', 0.0002);
    });

    const fechas = [
      { caso: 'CN-CUR-F5-04', fecha: '2026-10-01', rate: '0.0005', motivo: 'fecha pasada' },
      { caso: 'CN-CUR-F5-05', fecha: '2026-12-31', rate: '0.0004', motivo: 'fecha futura' },
    ];

    fechas.forEach(({ caso, fecha, rate, motivo }) => {
      it(`${caso} (alternativo): una tasa con ${motivo} no cambia la tasa vigente`, () => {
        cy.curApi('POST', 'CurrencyRecordRate', { recordId: copId, date: fecha, rate }).then((response) => {
          expect(response.status, statusReason(response)).to.eq(200);
          createdRates.push(response.body.id);
        });
        cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', COP_RATE);
      });
    });

    it('CN-CUR-F5-06 (exitoso): borrar una tasa que no es la vigente deja la configuración igual', () => {
      cy.curApi('POST', 'CurrencyRecordRate', { recordId: copId, date: '2026-09-01', rate: '0.0006' }).then((response) => {
        expect(response.status).to.eq(200);
        cy.curApi('DELETE', `CurrencyRecordRate/${response.body.id}`).its('status').should('eq', 200);
      });
      cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', COP_RATE);
    });

    it('ESC-CUR-F5-06 (error): un usuario normal no puede crear tasas', () => {
      cy.curCreateRegularUser().then((regular) => {
        cy.curApi('POST', 'CurrencyRecordRate', { recordId: copId, date: '2026-08-01', rate: '0.0007' }, { user: regular.user, pass: regular.pass })
          .then((response) => {
            if (response.status === 200) {
              createdRates.push(response.body.id);
            }

            expect(response.status).to.eq(403);
          });
        cy.curDeleteUser(regular.id);
      });
    });
  });

  context('Interfaz: panel Rates de Currencies › COP', () => {
    beforeEach(() => {
      cy.loginViaApi();
      cy.visit(`/#CurrencyRecord/view/${copId}`);
      cy.get('.panel[data-name="rates"]', { timeout: 15000 }).should('be.visible');
    });

    const openCreateModal = () => {
      cy.get('.panel[data-name="rates"] [data-action="createRelated"]').first().click({ force: true });
      cy.get('.modal .field[data-name="rate"] input', { timeout: 10000 }).should('be.visible');
    };

    ['-1', '0', '0.00009'].forEach((valor) => {
      it(`CN-CUR-F5-08 a 10 (error): la pantalla rechaza Rate = ${valor} sin enviar nada`, () => {
        cy.intercept('POST', '**/api/v1/CurrencyRecordRate').as('create');
        openCreateModal();

        cy.get('.modal .field[data-name="rate"] input').clear().type(valor);
        cy.get('.modal button[data-name="save"]').click();

        cy.contains(/shouldn't be less than 0\.0001|Not valid/i).should('be.visible');
        cy.get('.modal .field[data-name="rate"]').should('be.visible');
        cy.get('@create.all').should('have.length', 0);
      });
    });
  });
});
