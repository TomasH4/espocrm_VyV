// CUR-F3 Validación de campos de moneda (currency.ts + FieldValidators\CurrencyType).
// Vehículo: Campaign.budget. Escenarios ESC-CUR-F3-01 a 04.
import { statusReason } from '../../support/cur';

describe('CUR-F3 Validación de campos de moneda', () => {
  const created = [];

  const campaign = (name, extra = {}) => ({ name: `CUR-F3-CY ${name} ${Date.now()}`, ...extra });

  after(() => {
    created.forEach((id) => cy.curApi('DELETE', `Campaign/${id}`));
  });

  context('Interfaz: formulario de Campaign', () => {
    beforeEach(() => {
      cy.loginViaApi();
      cy.visit('/#Campaign/create');
      cy.get('.field[data-name="name"] input', { timeout: 15000 }).should('be.visible');
    });

    const saveAndGetId = () => {
      cy.intercept('POST', '**/api/v1/Campaign').as('save');
      cy.get('button[data-action="save"]').first().click();

      return cy.wait('@save').then(({ response }) => {
        expect(response.statusCode).to.eq(200);
        created.push(response.body.id);

        return response.body;
      });
    };

    it('CN-CUR-F3-19 (exitoso): el selector de moneda solo ofrece USD y COP', () => {
      cy.get('select[data-name="budgetCurrency"]').then(($select) => {
        // Selectize guarda la lista completa; el <select> original solo conserva la opción elegida.
        const selectize = $select[0].selectize;
        const values = selectize
          ? Object.keys(selectize.options)
          : [...$select[0].options].map((o) => o.value);

        expect(values.filter(Boolean).sort()).to.deep.eq(['COP', 'USD']);
      });
    });

    it('CN-CUR-F3-01 (exitoso): guarda 1000.50 USD y lo muestra con formato', () => {
      // Arrange
      cy.get('.field[data-name="name"] input').type(campaign('USD').name);
      cy.get('.field[data-name="budget"] input[data-name="budget"]').type('1000.50');
      cy.selectOption('budgetCurrency', 'USD');

      // Act + Assert
      saveAndGetId().then((body) => {
        expect(body.budget).to.eq(1000.5);
        expect(body.budgetCurrency).to.eq('USD');
      });
      cy.get('.field[data-name="budget"]').should('contain.text', '1,000.50');
    });

    it('CN-CUR-F3-09 (alternativo, OBS-CUR-05): las letras se descartan y se guarda sin presupuesto', () => {
      cy.get('.field[data-name="name"] input').type(campaign('letras').name);
      cy.get('.field[data-name="budget"] input[data-name="budget"]').type('12abc').blur();

      saveAndGetId().then((body) => {
        // Comportamiento actual documentado: la máscara AutoNumeric deja solo lo numérico o vacía el campo sin avisar.
        expect(body.budget === null || body.budget === 12, `budget guardado: ${body.budget}`).to.eq(true);
      });
    });
  });

  context('API: POST /Campaign', () => {
    it('CN-CUR-F3-03 (exitoso): monto válido en COP', () => {
      cy.curApi('POST', 'Campaign', campaign('COP', { budget: 2500000, budgetCurrency: 'COP' })).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.budgetCurrency).to.eq('COP');
        created.push(response.body.id);
      });
    });

    it('CN-CUR-F3-08 (valor límite, OBS-CUR-04): la API acepta 14 dígitos que la pantalla no deja escribir', () => {
      cy.curApi('POST', 'Campaign', campaign('14dig', { budget: 99999999999999, budgetCurrency: 'USD' })).then((response) => {
        expect(response.status).to.eq(200);
        created.push(response.body.id);
      });
    });

    const invalidos = [
      { caso: 'CN-CUR-F3-10', budget: 'abc', currency: 'USD', tipo: 'valid' },
      { caso: 'CN-CUR-F3-11', budget: '12.5.3', currency: 'USD', tipo: 'valid' },
      { caso: 'CN-CUR-F3-13', budget: 100, currency: 'EUR', tipo: 'validCurrency' },
      { caso: 'CN-CUR-F3-14', budget: 100, currency: 'XYZ', tipo: 'validCurrency' },
      { caso: 'CN-CUR-F3-15', budget: 100, currency: 'usd', tipo: 'validCurrency' },
    ];

    invalidos.forEach(({ caso, budget, currency, tipo }) => {
      it(`${caso} (error): budget ${JSON.stringify(budget)} ${currency} → 400 ${tipo}`, () => {
        cy.curApi('POST', 'Campaign', campaign(caso, { budget, budgetCurrency: currency })).then((response) => {
          if (response.status === 200) {
            created.push(response.body.id);
          }

          expect(response.status).to.eq(400);
          // X-Status-Reason: «Field validation failure; entityType: Campaign, field: budget, type: valid.»
          expect(statusReason(response))
            .to.contain('Field validation failure')
            .and.to.contain('field: budget')
            .and.to.contain(`type: ${tipo}.`);
        });
      });
    });
  });
});
