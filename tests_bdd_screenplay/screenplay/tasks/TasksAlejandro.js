/**
 * TasksAlejandro.js
 *
 * Tareas de negocio (patrón Screenplay) del módulo Moneda y tasas de cambio (CUR, Alejandro Bustamante).
 * Cada tarea encola comandos de Cypress y guarda en la memoria del actor lo que las preguntas necesitan.
 * Los comandos curApi, curConvert, curSetCopRate… están en cypress/support/cur.js.
 */
import '../../../cypress/support/cur';
import { Navigate, Click } from '../interactions/Interactions';

/** Inicia sesión en la interfaz (sesión cacheada con cy.session). */
export class IniciarSesion {
  static comoAdministrador() {
    return new IniciarSesion();
  }

  performAs() {
    cy.loginViaApi();
  }
}

/** Deja la tasa de COP del día en un valor (PUT /CurrencyRate). */
export class FijarTasaDeCop {
  constructor(tasa) {
    this.tasa = tasa;
  }

  static en(tasa) {
    return new FijarTasaDeCop(tasa);
  }

  performAs() {
    cy.curSetCopRate(this.tasa);
  }
}

/** Convierte un monto con ext\currency\convert por la API del Formula Sandbox. */
export class ConvertirMonto {
  constructor(monto, origen, destino) {
    Object.assign(this, { monto, origen, destino });
  }

  static de(monto, origen, destino) {
    return new ConvertirMonto(monto, origen, destino);
  }

  performAs(actor) {
    cy.curConvert(this.monto, this.origen, this.destino).then((respuesta) => actor.remember('respuesta', respuesta));
  }
}

/** Convierte un monto escribiendo la fórmula en el Formula Sandbox de la interfaz. */
export class ConvertirEnElSandbox {
  constructor(monto, origen, destino) {
    Object.assign(this, { monto, origen, destino });
  }

  static de(monto, origen, destino) {
    return new ConvertirEnElSandbox(monto, origen, destino);
  }

  performAs(actor) {
    Navigate.to('/#Admin/formulaSandbox').performAs(actor);
    cy.curTypeFormula(`output\\print(ext\\currency\\convert(${this.monto}, '${this.origen}', '${this.destino}'));`);
    cy.intercept('POST', '**/Formula/action/run').as('sandboxRun');
    Click.on('button[data-name="run"]').performAs(actor);
    cy.wait('@sandboxRun');
  }
}

/** Guarda una campaña desde el formulario con un presupuesto en una moneda. */
export class GuardarCampaniaEnPantalla {
  constructor(monto, moneda) {
    Object.assign(this, { monto, moneda });
  }

  static conPresupuesto(monto, moneda) {
    return new GuardarCampaniaEnPantalla(monto, moneda);
  }

  performAs(actor) {
    Navigate.to('/#Campaign/create').performAs(actor);
    cy.get('.field[data-name="name"] input', { timeout: 15000 }).type(`CUR-BDD ${Date.now()}`);
    cy.get('.field[data-name="budget"] input[data-name="budget"]').type(this.monto);
    cy.selectOption('budgetCurrency', this.moneda);
    cy.intercept('POST', '**/api/v1/Campaign').as('saveCampaign');
    Click.on('button[data-action="save"]:first').performAs(actor);
    cy.wait('@saveCampaign').then(({ response }) => {
      actor.remember('respuesta', { status: response.statusCode, body: response.body, headers: response.headers });
      actor.remember('limpiar', [...(actor.recall('limpiar') || []), `Campaign/${response.body.id}`]);
    });
  }
}

/** Abre el formulario de creación de Campaign (para consultar el selector de moneda). */
export class AbrirFormularioDeCampania {
  static nuevo() {
    return new AbrirFormularioDeCampania();
  }

  performAs(actor) {
    Navigate.to('/#Campaign/create').performAs(actor);
    cy.get('select[data-name="budgetCurrency"]', { timeout: 15000 }).should('exist');
  }
}

/** Crea una campaña por la API con el presupuesto dado (POST /Campaign). */
export class CrearCampaniaPorApi {
  constructor(monto, moneda) {
    Object.assign(this, { monto, moneda });
  }

  static conPresupuesto(monto, moneda) {
    return new CrearCampaniaPorApi(monto, moneda);
  }

  performAs(actor) {
    const body = { name: `CUR-BDD API ${Date.now()}`, budget: this.monto, budgetCurrency: this.moneda };

    cy.curApi('POST', 'Campaign', body).then((respuesta) => {
      actor.remember('respuesta', respuesta);

      if (respuesta.status === 200) {
        actor.remember('limpiar', [...(actor.recall('limpiar') || []), `Campaign/${respuesta.body.id}`]);
      }
    });
  }
}

/** Credenciales con las que el actor llama a la API: null significa anónimo, así que no se usa «??». */
const perfilDe = (actor) => (actor.recall('auth') === undefined ? 'admin' : actor.recall('auth'));

/** Envía PUT /CurrencyRate con el cuerpo dado, como el perfil que el actor recuerde (por defecto, administrador). */
export class ActualizarTasas {
  constructor(cuerpo) {
    this.cuerpo = cuerpo;
  }

  static con(cuerpo) {
    return new ActualizarTasas(cuerpo);
  }

  performAs(actor) {
    cy.curApi('PUT', 'CurrencyRate', this.cuerpo, perfilDe(actor)).then((r) => actor.remember('respuesta', r));
  }
}

/** Consulta GET /CurrencyRate con el perfil que el actor recuerde. */
export class ConsultarTasas {
  static vigentes() {
    return new ConsultarTasas();
  }

  performAs(actor) {
    cy.curApi('GET', 'CurrencyRate', undefined, perfilDe(actor)).then((r) => actor.remember('respuesta', r));
  }
}

/** Cambia el perfil con el que el actor llama a la API: 'administrador', 'usuario normal' o 'anónimo'. */
export class UsarPerfil {
  constructor(perfil) {
    this.perfil = perfil;
  }

  static llamado(perfil) {
    return new UsarPerfil(perfil);
  }

  performAs(actor) {
    if (this.perfil === 'anónimo') {
      actor.remember('auth', null);
    } else if (this.perfil === 'usuario normal') {
      cy.curCreateRegularUser().then((u) => {
        actor.remember('auth', { user: u.user, pass: u.pass });
        actor.remember('usuarioTemporal', u.id);
      });
    } else {
      actor.remember('auth', 'admin');
    }
  }
}

/** Busca la tasa vigente de COP (la más reciente con el valor configurado) y la recuerda. */
function conTasaVigente(actor, tasa, fn) {
  cy.curCopRecordId().then((copId) => {
    actor.remember('copId', copId);
    cy.curApi(
      'GET',
      `CurrencyRecordRate?maxSize=20&orderBy=date&order=desc&where[0][type]=equals&where[0][attribute]=recordId&where[0][value]=${copId}`
    ).then((r) => {
      const entrada = (r.body.list || []).find((x) => parseFloat(x.rate) === tasa);

      expect(entrada, 'tasa vigente de COP').to.exist;
      fn(entrada);
    });
  });
}

/** Edita la tasa vigente de COP por su registro (dispara el hook AfterSave). */
export class EditarTasaVigente {
  constructor(actual, nueva) {
    Object.assign(this, { actual, nueva });
  }

  static de(actual, nueva) {
    return new EditarTasaVigente(actual, nueva);
  }

  performAs(actor) {
    conTasaVigente(actor, this.actual, (entrada) => {
      cy.curApi('PUT', `CurrencyRecordRate/${entrada.id}`, { rate: String(this.nueva) }).then((r) => actor.remember('respuesta', r));
    });
  }
}

/** Registra una tasa de COP con fecha (POST /CurrencyRecordRate). */
export class RegistrarTasaConFecha {
  constructor(fecha, tasa) {
    Object.assign(this, { fecha, tasa });
  }

  static el(fecha, tasa) {
    return new RegistrarTasaConFecha(fecha, tasa);
  }

  performAs(actor) {
    cy.curCopRecordId().then((copId) => {
      cy.curApi('POST', 'CurrencyRecordRate', { recordId: copId, date: this.fecha, rate: String(this.tasa) }).then((r) => {
        actor.remember('respuesta', r);

        if (r.status === 200) {
          actor.remember('limpiar', [...(actor.recall('limpiar') || []), `CurrencyRecordRate/${r.body.id}`]);
        }
      });
    });
  }
}

/** Intenta guardar una tasa desde el panel Rates de Currencies › COP. */
export class IntentarGuardarTasaEnPantalla {
  constructor(valor) {
    this.valor = valor;
  }

  static conValor(valor) {
    return new IntentarGuardarTasaEnPantalla(valor);
  }

  performAs(actor) {
    cy.curCopRecordId().then((copId) => {
      Navigate.to(`/#CurrencyRecord/view/${copId}`).performAs(actor);
    });
    cy.get('.panel[data-name="rates"]', { timeout: 15000 }).should('be.visible');
    cy.intercept('POST', '**/api/v1/CurrencyRecordRate').as('createRate');
    cy.get('.panel[data-name="rates"] [data-action="createRelated"]').first().click({ force: true });
    cy.get('.modal .field[data-name="rate"] input', { timeout: 10000 }).clear().type(this.valor);
    Click.on('.modal button[data-name="save"]').performAs(actor);
  }
}
