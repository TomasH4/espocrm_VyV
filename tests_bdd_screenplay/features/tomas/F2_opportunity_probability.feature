# language: es
# encoding: UTF-8

Característica: Cálculo Automático de Probabilidad en Oportunidades
  Como usuario del CRM
  Quiero que la probabilidad se asigne automáticamente según la etapa de venta
  Para reflejar con exactitud el avance de cada oportunidad

  Antecedentes:
    Dado que el actor "Tomas" ha iniciado sesión en EspoCRM

  Escenario: [Exitoso] Asigna automáticamente 10% de probabilidad para la etapa Prospecting
    Dado que el actor navega al formulario de creación de Oportunidad
    Cuando el actor ingresa el nombre de oportunidad "Oportunidad Prospecting Test"
    Y el actor ingresa el monto "10000" y la fecha de cierre "2026-12-31"
    Y el actor selecciona la etapa "Prospecting"
    Y el actor hace clic en "Guardar"
    Entonces la API de oportunidad devuelve un código 200 o 201
    Y el cuerpo de la respuesta contiene la probabilidad 10
    Y el campo "probability" muestra el valor "10"
    Y el campo "stage" muestra el valor "Prospecting"

  Escenario: [Exitoso] Asigna automáticamente 100% de probabilidad para la etapa Closed Won
    Dado que el actor navega al formulario de creación de Oportunidad
    Cuando el actor ingresa el nombre de oportunidad "Oportunidad Ganada Test"
    Y el actor ingresa el monto "20000" y la fecha de cierre "2026-12-31"
    Y el actor selecciona la etapa "Closed Won"
    Y el actor hace clic en "Guardar"
    Entonces la API de oportunidad devuelve un código 200 o 201
    Y el cuerpo de la respuesta contiene la probabilidad 100
    Y el campo "probability" muestra el valor "100"
    Y el campo "stage" muestra el valor "Closed Won"

  Escenario: [Exitoso] Asigna automáticamente 0% de probabilidad para la etapa Closed Lost
    Dado que el actor navega al formulario de creación de Oportunidad
    Cuando el actor ingresa el nombre de oportunidad "Oportunidad Perdida Test"
    Y el actor ingresa el monto "5000" y la fecha de cierre "2026-12-31"
    Y el actor selecciona la etapa "Closed Lost"
    Y el actor hace clic en "Guardar"
    Entonces la API de oportunidad devuelve un código 200 o 201
    Y el cuerpo de la respuesta contiene la probabilidad 0
    Y el campo "probability" muestra el valor "0"
    Y el campo "stage" muestra el valor "Closed Lost"

  Escenario: [Alternativo] Recalcula dinámicamente la probabilidad de 10% a 50% al actualizar de Prospecting a Proposal
    Dado que existe una Oportunidad creada en etapa "Prospecting" con probabilidad 10
    Cuando el actor navega a la edición de dicha oportunidad
    Y el actor selecciona la etapa "Proposal"
    Y el actor hace clic en "Guardar"
    Entonces la API de actualización de oportunidad devuelve un código 200 o 201
    Y el cuerpo de la respuesta contiene la probabilidad 50
    Y el campo "probability" muestra el valor "50"
    Y el campo "stage" muestra el valor "Proposal"

  Escenario: [Error] Manejo de error 500 al fallar la persistencia de la oportunidad
    Dado que la API de Oportunidad está configurada para responder con error 500
    Y que el actor navega al formulario de creación de Oportunidad
    Cuando el actor ingresa el nombre "Oportunidad Error 500" con monto "8000" y fecha "2026-12-31" en etapa "Proposal"
    Y el actor hace clic en "Guardar"
    Entonces la respuesta de oportunidad interceptada tiene el código 500
    Y aparece una notificación de error en la interfaz
    Y la URL permanece en "#Opportunity/create"

