/**
 * QuestionsAlejandro.js
 *
 * Preguntas (patrón Screenplay) del módulo Moneda y tasas de cambio (CUR, Alejandro Bustamante).
 * Cada pregunta devuelve una cadena de Cypress con la respuesta, para que el paso Entonces la verifique.
 */
import { statusReason } from '../../../cypress/support/cur';

/** Última respuesta HTTP que recuerda el actor. */
export class UltimaRespuesta {
  static recibida() {
    return new UltimaRespuesta();
  }

  answeredBy(actor) {
    return cy.wrap(null).then(() => actor.recall('respuesta'));
  }
}

/** Código HTTP de la última respuesta. */
export class CodigoDeRespuesta {
  static recibido() {
    return new CodigoDeRespuesta();
  }

  answeredBy(actor) {
    return UltimaRespuesta.recibida().answeredBy(actor).then((r) => r.status);
  }
}

/** Motivo del error de la última respuesta (cabecera X-Status-Reason o cuerpo). */
export class MotivoDelError {
  static informado() {
    return new MotivoDelError();
  }

  answeredBy(actor) {
    return UltimaRespuesta.recibida().answeredBy(actor).then((r) => statusReason(r));
  }
}

/** Resultado (output) de la última conversión ejecutada por la API. */
export class ResultadoDeLaConversion {
  static obtenido() {
    return new ResultadoDeLaConversion();
  }

  answeredBy(actor) {
    return UltimaRespuesta.recibida().answeredBy(actor).then((r) => r.body.output);
  }
}

/** Texto del campo Output del Formula Sandbox. */
export class SalidaDelSandbox {
  static mostrada() {
    return new SalidaDelSandbox();
  }

  answeredBy() {
    return cy.get('.field[data-name="output"]');
  }
}

/** Tasa de una moneda en la configuración (GET /CurrencyRate como administrador). */
export class TasaConfigurada {
  constructor(moneda) {
    this.moneda = moneda;
  }

  static de(moneda) {
    return new TasaConfigurada(moneda);
  }

  answeredBy() {
    return cy.curApi('GET', 'CurrencyRate').its(`body.${this.moneda}`);
  }
}

/** Monedas que ofrece el selector del campo Budget (control Selectize). */
export class MonedasDelSelector {
  static ofrecidas() {
    return new MonedasDelSelector();
  }

  answeredBy() {
    return cy.get('select[data-name="budgetCurrency"]').then(($s) => {
      const s = $s[0].selectize;
      const values = s ? Object.keys(s.options) : [...$s[0].options].map((o) => o.value);

      return values.filter(Boolean).sort();
    });
  }
}

/** Presupuesto que muestra la vista de detalle de la campaña. */
export class PresupuestoMostrado {
  static enElDetalle() {
    return new PresupuestoMostrado();
  }

  answeredBy() {
    return cy.get('.field[data-name="budget"]');
  }
}

/** Cantidad de peticiones de creación de tasa que salieron desde la pantalla. */
export class PeticionesDeCreacionDeTasa {
  static enviadas() {
    return new PeticionesDeCreacionDeTasa();
  }

  answeredBy() {
    return cy.get('@createRate.all').then((calls) => calls.length);
  }
}
