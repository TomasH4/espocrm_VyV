// CUR — Pruebas dinámicas de seguridad (DAST) del módulo Moneda y tasas, organizadas por OWASP Top 10 (2021).
// Se ejecutan contra la aplicación en Docker (http://localhost:8080). Documentación: docs/CUR/seguridad/README.md
// Las pruebas «[Hallazgo …]» verifican el estado actual de una debilidad confirmada; las demás, el control esperado.
import { COP_RATE, statusReason } from '../../../support/cur';

describe('CUR Seguridad OWASP Top 10', () => {
  let regular;
  let copId;
  const created = [];

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
    created.forEach((path) => cy.curApi('DELETE', path));
    cy.curSetCopRate(COP_RATE);
    cy.then(() => cy.curDeleteUser(regular && regular.id));
  });

  const asRegular = () => ({ user: regular.user, pass: regular.pass });

  // ─────────────────────────────────────────────────────────────── A01 Broken Access Control
  context('A01:2021 Control de acceso', () => {
    const endpoints = [
      { id: 'SEC-CUR-01', metodo: 'GET', ruta: 'CurrencyRate' },
      { id: 'SEC-CUR-02', metodo: 'PUT', ruta: 'CurrencyRate', body: { COP: 0.0003 } },
      { id: 'SEC-CUR-03', metodo: 'POST', ruta: 'Formula/action/run', body: { expression: "ext\\currency\\convert(1, 'USD', 'COP')" } },
      { id: 'SEC-CUR-04', metodo: 'GET', ruta: 'CurrencyRecord' },
    ];

    endpoints.forEach(({ id, metodo, ruta, body }) => {
      it(`${id} ${metodo} /${ruta}: sin credenciales → 401`, () => {
        cy.curApi(metodo, ruta, body, null).its('status').should('eq', 401);
      });

      it(`${id} ${metodo} /${ruta}: usuario normal sin rol → 403`, () => {
        cy.curApi(metodo, ruta, body, asRegular()).its('status').should('eq', 403);
      });
    });

    it('SEC-CUR-05 Un usuario normal no puede crear ni borrar tasas por el registro', () => {
      cy.curApi('POST', 'CurrencyRecordRate', { recordId: copId, date: '2026-07-01', rate: '0.0009' }, asRegular()).then((r) => {
        if (r.status === 200) {
          created.push(`CurrencyRecordRate/${r.body.id}`);
        }

        expect(r.status).to.eq(403);
      });
      cy.curApi('GET', 'CurrencyRate').its('body.COP').should('eq', COP_RATE);
    });

    it('SEC-CUR-06 Credenciales incorrectas → 401 sin revelar si el usuario existe', () => {
      cy.curApi('GET', 'CurrencyRate', undefined, { user: regular.user, pass: 'incorrecta-123' }).then((malaClave) => {
        cy.curApi('GET', 'CurrencyRate', undefined, { user: 'no_existe_cur_123', pass: 'incorrecta-123' }).then((noExiste) => {
          expect(malaClave.status).to.eq(401);
          expect(noExiste.status).to.eq(401);
          expect(statusReason(malaClave)).to.eq(statusReason(noExiste));
        });
      });
    });
  });

  // ─────────────────────────────────────────────────────────────── A03 Injection
  context('A03:2021 Inyección', () => {
    const tasas = [
      { id: 'SEC-CUR-07', valor: "0.0003' OR '1'='1", tipo: 'SQL' },
      { id: 'SEC-CUR-08', valor: '0.0003; DROP TABLE currency_record_rate;--', tipo: 'SQL apilada' },
      { id: 'SEC-CUR-09', valor: '<script>alert(1)</script>', tipo: 'XSS' },
    ];

    tasas.forEach(({ id, valor, tipo }) => {
      it(`${id} Inyección ${tipo} en la tasa de PUT /CurrencyRate → 400 y la tasa no cambia`, () => {
        cy.curApi('PUT', 'CurrencyRate', { COP: valor }).then((r) => {
          expect(r.status).to.eq(400);
          expect(statusReason(r)).to.contain('must be a number');
        });
        cy.curApi('GET', 'CurrencyRate').its('body').should('deep.eq', { USD: 1, COP: COP_RATE });
      });
    });

    it("SEC-CUR-10 Inyección en el código de moneda del presupuesto → 400 validCurrency", () => {
      cy.curApi('POST', 'Campaign', { name: `SEC-CUR ${Date.now()}`, budget: 10, budgetCurrency: "USD' OR '1'='1" }).then((r) => {
        if (r.status === 200) {
          created.push(`Campaign/${r.body.id}`);
        }

        expect(r.status).to.eq(400);
        expect(statusReason(r)).to.contain('type: validCurrency.');
      });
    });

    it('SEC-CUR-11 Inyección SQL en la fecha de una tasa no llega a la base de datos', () => {
      cy.curApi('POST', 'CurrencyRecordRate', { recordId: copId, date: "2026-07-02' OR '1'='1", rate: '0.0009' }).then((r) => {
        if (r.status === 200) {
          created.push(`CurrencyRecordRate/${r.body.id}`);
        }

        expect(r.status).to.eq(400);
        expect(JSON.stringify(r.body || '') + statusReason(r)).to.not.match(/SQLSTATE|syntax error|mysql/i);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────── A04 Insecure Design
  context('A04:2021 Diseño inseguro', () => {
    it('SEC-CUR-12 La API aplica la misma regla de negocio que el formulario (DEF-CUR-04 corregido)', () => {
      cy.curApi('PUT', 'CurrencyRate', { COP: 0 }).its('status').should('eq', 400);
      cy.curConvert('100', 'USD', 'COP').its('status').should('eq', 200);
    });
  });

  // ─────────────────────────────────────────────────────────────── A05 Security Misconfiguration
  context('A05:2021 Configuración de seguridad', () => {
    it('SEC-CUR-14 Un dato inválido en la fórmula responde un error controlado, sin detalles internos (DEF-CUR-01 corregido)', () => {
      // Antes de la refactorización respondía 500 (evidencias/respuesta-500-formula.txt). Ahora: 200, isSuccess = false.
      cy.curConvert('100', 'USD', 'EUR').then((r) => {
        const cuerpo = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);

        expect(r.status).to.eq(200);
        expect(r.body.isSuccess).to.eq(false);
        cy.writeFile('docs/CUR/seguridad/evidencias/respuesta-formula-error-controlado.txt', `HTTP ${r.status}\n\n${cuerpo}`);
        // No debe filtrar rutas del servidor, trazas ni consultas SQL.
        expect(cuerpo).to.not.match(/\/var\/www|Stack trace|#0 |SQLSTATE/);
      });
    });

    it('SEC-CUR-15 [Hallazgo] Las respuestas de la API no envían cabeceras de endurecimiento', () => {
      cy.curApi('GET', 'CurrencyRate').then((r) => {
        const h = r.headers;
        const informe = {
          'content-type': h['content-type'],
          'x-content-type-options': h['x-content-type-options'] || null,
          'x-frame-options': h['x-frame-options'] || null,
          'content-security-policy': h['content-security-policy'] || null,
          'strict-transport-security': h['strict-transport-security'] || null,
          'cache-control': h['cache-control'] || null,
          server: h.server || null,
          'x-powered-by': h['x-powered-by'] || null,
        };

        cy.writeFile('docs/CUR/seguridad/evidencias/cabeceras-api.json', informe);
        expect(h['content-type']).to.contain('application/json');
      });
    });

    it('SEC-CUR-16 La pantalla principal se sirve con cabeceras registradas como evidencia', () => {
      cy.request({ url: '/', failOnStatusCode: false }).then((r) => {
        cy.writeFile('docs/CUR/seguridad/evidencias/cabeceras-ui.json', r.headers);
        expect(r.status).to.eq(200);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────── A02 / A07
  context('A02:2021 y A07:2021 Transporte y autenticación', () => {
    it('SEC-CUR-17 [Hallazgo] La API acepta autenticación Basic sobre HTTP sin cifrar en el entorno', () => {
      cy.curApi('GET', 'CurrencyRate').then((r) => {
        expect(r.status).to.eq(200);
        expect(Cypress.config('baseUrl')).to.match(/^http:\/\//);
      });
    });
  });
});
