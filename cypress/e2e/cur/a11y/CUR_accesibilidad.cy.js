// CUR — Accesibilidad WCAG 2.1 AA de las pantallas del módulo Moneda y tasas de cambio (Alejandro Bustamante).
// 1) Auditoría automática con axe-core (cypress-axe): guarda el informe de cada pantalla en docs/CUR/accesibilidad/axe
//    y falla si aparece una barrera nueva frente a la línea base documentada (regresión de accesibilidad).
// 2) Comprobaciones manuales codificadas (teclado, foco, etiquetas, contraste, mensajes y adaptación visual), cada una
//    con su criterio WCAG. Las que hoy fallan se nombran «[Barrera …]» y verifican el estado actual documentado.
// Documentación: docs/CUR/accesibilidad/README.md
import 'cypress-axe';
import '../../../support/cur';

const OUT = 'docs/CUR/accesibilidad/axe';
const WCAG_AA = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } };

// Barreras comunes al marco de EspoCRM (barra de navegación y página) presentes en todas las pantallas.
const COMUNES = ['aria-command-name', 'autocomplete-valid', 'color-contrast', 'html-has-lang', 'link-name', 'meta-viewport', 'label', 'button-name'];

const PANTALLAS = [
  { slug: 'formula-sandbox', nombre: 'Formula Sandbox (CUR-F1, F2)', url: () => '/#Admin/formulaSandbox', listo: '.field[data-name="script"] .ace_editor', extra: ['link-in-text-block'] },
  { slug: 'campaign-create', nombre: 'Formulario de Campaign (CUR-F3)', url: () => '/#Campaign/create', listo: '.field[data-name="budget"]', extra: [] },
  { slug: 'currency-list', nombre: 'Lista de monedas (CUR-F5)', url: () => '/#CurrencyRecord', listo: '#main .list', extra: [] },
  { slug: 'currency-cop', nombre: 'Detalle de COP con panel Rates (CUR-F5)', url: (id) => `/#CurrencyRecord/view/${id}`, listo: '.panel[data-name="rates"]', extra: [] },
  { slug: 'admin-currency', nombre: 'Administration › Currency (CUR-F5)', url: () => '/#Admin/currency', listo: '#main .record', extra: [] },
];

const resumen = (r) =>
  r.violations.map((v) => ({
    id: v.id,
    impacto: v.impact,
    wcag: v.tags.filter((t) => /^wcag\d/.test(t)),
    ayuda: v.help,
    nodos: v.nodes.length,
    ejemplo: v.nodes[0] && v.nodes[0].target.join(' '),
  }));

// Un reintento en `cypress run`: la vista de EspoCRM a veces tarda más de 20 s en montarse y eso no es un resultado de accesibilidad.
describe('CUR Accesibilidad WCAG 2.1 AA', { retries: { runMode: 1, openMode: 0 } }, () => {
  let copId;

  before(() => {
    cy.curCopRecordId().then((id) => {
      copId = id;
    });
  });

  beforeEach(() => {
    cy.loginViaApi();
  });

  const abrirModalDeTasa = () => {
    cy.visit(`/#CurrencyRecord/view/${copId}`);
    cy.get('.panel[data-name="rates"]', { timeout: 20000 }).should('be.visible');
    cy.get('.panel[data-name="rates"] [data-action="createRelated"]').first().click({ force: true });
    cy.get('.modal .field[data-name="rate"] input', { timeout: 10000 }).should('be.visible');
  };

  // ─────────────────────────────────────────────────────────────── 1. Auditoría automática (axe-core)
  context('1. Auditoría automática con axe-core', () => {
    PANTALLAS.forEach(({ slug, nombre, url, listo, extra }) => {
      it(`CP-A11Y-CUR-01 ${nombre}: sin barreras nuevas frente a la línea base`, () => {
        cy.visit(url(copId));
        cy.get(listo, { timeout: 20000 }).should('exist');
        cy.wait(800);
        cy.injectAxe();
        cy.window()
          .then((win) => win.axe.run(win.document, WCAG_AA))
          .then((r) => {
            const violaciones = resumen(r);

            cy.writeFile(`${OUT}/${slug}.json`, { pantalla: nombre, fecha: new Date().toISOString(), aprobadas: r.passes.length, violaciones });

            const nuevas = violaciones.map((v) => v.id).filter((id) => !COMUNES.concat(extra).includes(id));

            expect(nuevas, `barreras nuevas en ${nombre}`).to.deep.eq([]);
          });
      });
    });

    it('CP-A11Y-CUR-01 Modal de nueva tasa (CUR-F5): sin barreras nuevas frente a la línea base', () => {
      abrirModalDeTasa();
      cy.wait(600);
      cy.injectAxe();
      cy.window()
        .then((win) => win.axe.run(win.document.querySelector('.modal.in'), WCAG_AA))
        .then((r) => {
          const violaciones = resumen(r);

          cy.writeFile(`${OUT}/rate-modal.json`, { pantalla: 'Modal de nueva tasa', fecha: new Date().toISOString(), aprobadas: r.passes.length, violaciones });
          expect(violaciones.map((v) => v.id).filter((id) => !COMUNES.includes(id))).to.deep.eq([]);
        });
    });
  });

  // ─────────────────────────────────────────────────────────────── 2. Comprobaciones manuales codificadas
  context('2. Teclado (WCAG 2.1.1, 2.1.2)', () => {
    it('CP-A11Y-CUR-02 [2.1.1 Cumple] La moneda del presupuesto se elige solo con teclado', () => {
      cy.visit('/#Campaign/create');
      cy.get('.field[data-name="budget"] input[data-name="budget"]', { timeout: 20000 }).focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.focused().should('be.visible').closest('.selectize-control').should('exist');
      cy.focused().type('COP{enter}');
      cy.get('select[data-name="budgetCurrency"]').should('have.value', 'COP');
    });

    it('CP-A11Y-CUR-03 [2.1.2 Cumple] El editor de fórmulas no atrapa el foco: Tab sale del editor', () => {
      cy.visit('/#Admin/formulaSandbox');
      cy.get('.field[data-name="script"] .ace_editor', { timeout: 20000 }).click();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.focused().then(($el) => expect($el.closest('.ace_editor').length, 'foco fuera del editor').to.eq(0));
    });

    it('CP-A11Y-CUR-04 [2.1.2 Cumple] Esc cierra el modal de tasa y el foco vuelve a la página', () => {
      abrirModalDeTasa();
      cy.get('.modal .field[data-name="rate"] input').focus().type('{esc}');
      cy.get('.modal.in .field[data-name="rate"]').should('not.exist');
      cy.focused().should('be.visible').and(($el) => expect($el.closest('.modal').length).to.eq(0));
    });
  });

  context('3. Foco (WCAG 2.4.3, 2.4.7)', () => {
    it('CP-A11Y-CUR-05 [2.4.7 Cumple] El campo enfocado muestra un indicador visible', () => {
      cy.visit('/#Campaign/create');
      cy.get('.field[data-name="budget"] input[data-name="budget"]', { timeout: 20000 }).focus();
      cy.wait(600);
      cy.focused().then(($el) => {
        const s = getComputedStyle($el[0]);

        // Bootstrap: borde azul y resplandor de 8 px en lugar del contorno nativo.
        expect(s.borderColor).to.eq('rgb(102, 175, 233)');
        expect(s.boxShadow).to.contain('8px');
      });
    });

    it('CP-A11Y-CUR-06 [2.4.3 Cumple] Al abrir el modal de tasa el foco entra en el diálogo', () => {
      abrirModalDeTasa();
      cy.focused().closest('.modal[role="dialog"]').should('exist');
    });

    it('CP-A11Y-CUR-07 [Barrera 2.4.3] El foco sale del modal al final del recorrido con Tab', () => {
      abrirModalDeTasa();
      cy.get('.modal .field[data-name="rate"] input').focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      // Estado actual: tras el último campo el foco vuelve al <body>, fuera del diálogo (no hay ciclo de foco).
      cy.document().then((d) => expect(d.activeElement.closest('.modal')).to.eq(null));
    });
  });

  context('4. Etiquetas, idioma y nombres accesibles (WCAG 1.3.1, 3.1.1, 4.1.2)', () => {
    it('CP-A11Y-CUR-08 [Barrera 1.3.1 / 4.1.2] Los campos Name y Budget no tienen etiqueta asociada', () => {
      cy.visit('/#Campaign/create');
      cy.get('.field[data-name="budget"] input[data-name="budget"]', { timeout: 20000 }).should('be.visible');
      ['name', 'budget'].forEach((campo) => {
        cy.get(`.field[data-name="${campo}"] input`).first().then(($in) => {
          const el = $in[0];
          const asociada = (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');

          // La etiqueta visible existe (label[data-name]) pero no está vinculada al campo.
          cy.get(`label[data-name="${campo}"]`).should('be.visible');
          expect(asociada, `etiqueta asociada a ${campo}`).to.not.be.ok;
        });
      });
    });

    it('CP-A11Y-CUR-09 [Barrera 3.1.1] La página no declara su idioma', () => {
      cy.visit('/#Campaign/create');
      cy.get('html').should('not.have.attr', 'lang');
    });
  });

  context('5. Contraste (WCAG 1.4.3)', () => {
    it('CP-A11Y-CUR-10 [Barrera 1.4.3] Las etiquetas de los campos tienen contraste 2.95:1 (mínimo 4.5:1)', () => {
      cy.visit('/#Campaign/create');
      cy.get('label[data-name="budget"] .label-text', { timeout: 20000 }).should('be.visible');
      cy.injectAxe();
      cy.window()
        .then((win) => win.axe.run(win.document.querySelector('label[data-name="budget"]'), { runOnly: ['color-contrast'] }))
        .then((r) => {
          const nodo = r.violations[0] && r.violations[0].nodes[0];

          expect(nodo, 'violación de contraste en la etiqueta Budget').to.exist;
          expect(nodo.any[0].data.contrastRatio).to.be.lessThan(4.5);
          cy.writeFile(`${OUT}/contraste-etiqueta-budget.json`, nodo.any[0].data);
        });
    });
  });

  context('6. Mensajes de error (WCAG 3.3.1, 4.1.3)', () => {
    it('CP-A11Y-CUR-11 [3.3.1 Cumple] El error de la tasa se muestra en texto y está ligado al campo', () => {
      abrirModalDeTasa();
      cy.get('.modal .field[data-name="rate"] input').clear().type('-1');
      cy.get('.modal button[data-name="save"]').click();
      cy.contains('.popover', "Rate shouldn't be less than 0.0001").should('be.visible').invoke('attr', 'id').then((id) => {
        cy.get('.modal .field[data-name="rate"] input').should('have.attr', 'aria-describedby', id);
      });
    });

    it('CP-A11Y-CUR-12 [Barrera 3.3.1 / 4.1.3] El campo con error no se marca como inválido ni se anuncia', () => {
      abrirModalDeTasa();
      cy.get('.modal .field[data-name="rate"] input').clear().type('0');
      cy.get('.modal button[data-name="save"]').click();
      cy.contains('.popover', "Rate shouldn't be less than 0.0001").should('be.visible')
        .and('have.attr', 'role', 'tooltip')
        .and('not.have.attr', 'aria-live');
      cy.get('.modal .field[data-name="rate"] input').should('not.have.attr', 'aria-invalid');
    });
  });

  context('7. Adaptación visual (WCAG 1.4.4, 1.4.10)', () => {
    it('CP-A11Y-CUR-13 [1.4.10 Cumple] A 320 px de ancho el formulario no necesita desplazamiento horizontal', () => {
      cy.viewport(320, 800);
      cy.visit('/#Campaign/create');
      cy.get('.field[data-name="budget"]', { timeout: 20000 }).should('be.visible');
      cy.window().then((win) => expect(win.document.documentElement.scrollWidth).to.be.at.most(win.innerWidth));
    });

    it('CP-A11Y-CUR-14 [Barrera 1.4.4] La página bloquea el zoom en móviles (user-scalable=no)', () => {
      cy.visit('/#Campaign/create');
      cy.get('meta[name="viewport"]').should('have.attr', 'content').and('contain', 'user-scalable=no');
    });
  });
});
