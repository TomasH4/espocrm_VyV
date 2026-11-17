/**
 * step_definitions_alejandro.js
 *
 * Pasos Gherkin del módulo Moneda y tasas de cambio (CUR, Alejandro Bustamante), con el patrón Screenplay:
 * el actor Alejandro tiene las habilidades BrowseTheWeb y CallAnApi; los pasos Cuando ejecutan tareas
 * (TasksAlejandro) y los pasos Entonces verifican preguntas (QuestionsAlejandro).
 *
 * El preprocesador carga todos los step_definitions del equipo en cada feature: por eso todas las frases
 * empiezan por «Alejandro…» o son exclusivas del módulo, y los hooks se limitan a la etiqueta @CUR.
 */
import { Given, When, Then, Before, After } from '@badeball/cypress-cucumber-preprocessor';
import { Actor } from '../../screenplay/actor/Actor';
import { BrowseTheWeb } from '../../screenplay/abilities/BrowseTheWeb';
import { CallAnApi } from '../../screenplay/abilities/CallAnApi';
import {
  IniciarSesion, FijarTasaDeCop, ConvertirMonto, ConvertirEnElSandbox, GuardarCampaniaEnPantalla,
  AbrirFormularioDeCampania, CrearCampaniaPorApi, ActualizarTasas, ConsultarTasas, UsarPerfil,
  EditarTasaVigente, RegistrarTasaConFecha, IntentarGuardarTasaEnPantalla,
} from '../../screenplay/tasks/TasksAlejandro';
import {
  CodigoDeRespuesta, MotivoDelError, ResultadoDeLaConversion, SalidaDelSandbox, TasaConfigurada,
  MonedasDelSelector, PresupuestoMostrado, UltimaRespuesta, PeticionesDeCreacionDeTasa,
} from '../../screenplay/questions/QuestionsAlejandro';
import { COP_RATE } from '../../../cypress/support/cur';

let alejandro;

Before({ tags: '@CUR' }, () => {
  alejandro = Actor.named('Alejandro')
    .whoCan('browseTheWeb', BrowseTheWeb.using(cy))
    .whoCan('callAnApi', CallAnApi.at('http://localhost:8080/api/v1'));
});

After({ tags: '@CUR' }, () => {
  (alejandro.recall('limpiar') || []).forEach((path) => cy.curApi('DELETE', path));
  cy.curDeleteUser(alejandro.recall('usuarioTemporal'));
  cy.curSetCopRate(COP_RATE);
});

/** Convierte el texto de un ejemplo en número cuando lo es ('100' → 100, 'abc' → 'abc'). */
const valor = (texto) => (texto.trim() !== '' && !Number.isNaN(Number(texto)) ? Number(texto) : texto);

// ─────────────────────────────────────────────────────────────── Contexto

Given('que Alejandro administra un CRM con USD como moneda base', () => {
  alejandro.asks(TasaConfigurada.de('USD')).should('eq', 1);
});

Given('la tasa de COP es {float} USD', (tasa) => {
  alejandro.attemptsTo(FijarTasaDeCop.en(tasa));
});

Given('que Alejandro inició sesión como administrador', () => {
  alejandro.attemptsTo(IniciarSesion.comoAdministrador());
});

Given('que Alejandro llama a la API como {string}', (perfil) => {
  alejandro.attemptsTo(UsarPerfil.llamado(perfil));
});

// ─────────────────────────────────────────────────────────────── CUR-F1 y CUR-F2

When('Alejandro convierte el monto {string} de {string} a {string}', (monto, origen, destino) => {
  alejandro.attemptsTo(ConvertirMonto.de(monto, origen, destino));
});

When('Alejandro convierte {string} de {string} a {string} en el Formula Sandbox', (monto, origen, destino) => {
  alejandro.attemptsTo(ConvertirEnElSandbox.de(monto, origen, destino));
});

Then('el resultado de la conversión es {string}', (esperado) => {
  alejandro.asks(CodigoDeRespuesta.recibido()).should('eq', 200);
  alejandro.asks(ResultadoDeLaConversion.obtenido()).then((salida) => {
    // Los montos sin decimales (p. ej. misma moneda) se comparan por valor.
    if (esperado.includes('.')) {
      expect(salida).to.contain(esperado);
    } else {
      expect(parseFloat(salida)).to.eq(Number(esperado));
    }
  });
});

Then('el Formula Sandbox muestra {string}', (esperado) => {
  alejandro.asks(SalidaDelSandbox.mostrada()).should('contain.text', esperado);
});

// DEF-CUR-01 y 02 corregidos (docs/CUR/refactor): antes un 500; ahora un error de fórmula controlado con la causa.
Then('la conversión se rechaza con el mensaje {string}', (mensaje) => {
  alejandro.asks(CodigoDeRespuesta.recibido()).should('eq', 200);
  alejandro.asks(UltimaRespuesta.recibida()).then((r) => {
    expect(r.body.isSuccess).to.eq(false);
    expect(r.body.message).to.contain(mensaje);
  });
});

// ─────────────────────────────────────────────────────────────── CUR-F3

When('Alejandro guarda una campaña con presupuesto {string} en {string} desde el formulario', (monto, moneda) => {
  alejandro.attemptsTo(GuardarCampaniaEnPantalla.conPresupuesto(monto, moneda));
});

When('Alejandro abre el formulario de una campaña nueva', () => {
  alejandro.attemptsTo(AbrirFormularioDeCampania.nuevo());
});

When('Alejandro crea por API una campaña con presupuesto {string} en {string}', (monto, moneda) => {
  alejandro.attemptsTo(CrearCampaniaPorApi.conPresupuesto(valor(monto), moneda));
});

Then('la campaña se guarda con presupuesto {float} {string}', (monto, moneda) => {
  alejandro.asks(UltimaRespuesta.recibida()).then((r) => {
    expect(r.status).to.eq(200);
    expect(r.body.budget).to.eq(monto);
    expect(r.body.budgetCurrency).to.eq(moneda);
  });
});

Then('el detalle muestra el presupuesto {string}', (texto) => {
  alejandro.asks(PresupuestoMostrado.enElDetalle()).should('contain.text', texto);
});

Then('el selector de moneda ofrece solo {string}', (lista) => {
  alejandro.asks(MonedasDelSelector.ofrecidas()).should('deep.eq', lista.split(',').map((s) => s.trim()).sort());
});

// ─────────────────────────────────────────────────────────────── CUR-F4

When('Alejandro actualiza las tasas con {string}', (cuerpo) => {
  alejandro.attemptsTo(ActualizarTasas.con(JSON.parse(cuerpo)));
});

When('Alejandro consulta las tasas', () => {
  alejandro.attemptsTo(ConsultarTasas.vigentes());
});

When('Alejandro modifica las tasas', () => {
  alejandro.attemptsTo(ActualizarTasas.con({ COP: 0.0003 }));
});

Then('la API responde {int}', (codigo) => {
  alejandro.asks(CodigoDeRespuesta.recibido()).should('eq', codigo);
});

Then('el motivo del error contiene {string}', (texto) => {
  alejandro.asks(MotivoDelError.informado()).should('contain', texto);
});

Then('la tasa configurada de {string} es {float}', (moneda, tasa) => {
  alejandro.asks(TasaConfigurada.de(moneda)).should('eq', tasa);
});

// ─────────────────────────────────────────────────────────────── CUR-F5

When('Alejandro cambia la tasa vigente de COP de {float} a {float}', (actual, nueva) => {
  alejandro.attemptsTo(EditarTasaVigente.de(actual, nueva));
});

When('Alejandro registra para COP la tasa {float} con fecha {string}', (tasa, fecha) => {
  alejandro.attemptsTo(RegistrarTasaConFecha.el(fecha, tasa));
});

When('Alejandro intenta guardar en Currencies › COP una tasa de {string}', (valorTasa) => {
  alejandro.attemptsTo(IntentarGuardarTasaEnPantalla.conValor(valorTasa));
});

Then('la pantalla avisa que la tasa no es válida', () => {
  cy.contains(/shouldn't be less than 0\.0001|Not valid/i).should('be.visible');
  cy.get('.modal .field[data-name="rate"]').should('be.visible');
});

Then('no se envía ninguna tasa al servidor', () => {
  alejandro.asks(PeticionesDeCreacionDeTasa.enviadas()).should('eq', 0);
});
