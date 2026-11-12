# language: es
# encoding: UTF-8

Característica: Validación Temporal y Cálculo de Duración al Agendar Reuniones
  Como usuario del CRM
  Quiero que el sistema calcule automáticamente la duración de las reuniones
  Para garantizar la coherencia temporal de los eventos agendados

  Antecedentes:
    Dado que el actor "Tomas" ha iniciado sesión en EspoCRM

  Escenario: [Exitoso] Calcula automáticamente la duración (90 min) a partir de dateStart y dateEnd
    Dado que el actor navega al formulario de creación de Reunión
    Cuando el actor ingresa los siguientes datos de la reunión:
      | name         | Comité Técnico VyV |
      | dateEnd      | 2026-11-10         |
      | dateEndTime  | 11:30              |
      | dateStart    | 2026-11-10         |
      | dateStartTime| 10:00              |
    Y el actor hace clic en "Guardar"
    Entonces la API de reunión devuelve un código 200 o 201
    Y el cuerpo de la respuesta contiene el nombre "Comité Técnico VyV"
    Y la URL contiene "#Meeting/view/"

  Escenario: [Exitoso] Proyecta automáticamente la fecha de fin a partir de dateStart y duración manual de 30 min
    Dado que el actor navega al formulario de creación de Reunión
    Cuando el actor ingresa el nombre de reunión "Llamada Rápida 30min"
    Y el actor ingresa la fecha de inicio "2026-11-10" y hora de inicio "15:00"
    Y el actor selecciona la duración de "1800" segundos
    Y el actor hace clic en "Guardar"
    Entonces la API de reunión devuelve un código 200 o 201
    Y el campo "dateEnd" de la respuesta es posterior al campo "dateStart"
    Y la URL contiene "#Meeting/view/"

  Escenario: [Alternativo] Asigna duración por defecto de 60 minutos cuando se omiten dateEnd y duración
    Dado que el actor navega al formulario de creación de Reunión
    Cuando el actor ingresa el nombre de reunión "Reunión General 1 Hora"
    Y el actor ingresa la fecha de inicio "2026-11-10" y hora de inicio "09:00"
    Y el actor hace clic en "Guardar"
    Entonces la API de reunión devuelve un código 200 o 201
    Y el campo "dateEnd" de la respuesta es posterior al campo "dateStart"
    Y la URL contiene "#Meeting/view/"

  Escenario: [Error] Rechaza la creación si la fecha y hora de inicio está vacía
    Dado que el actor navega al formulario de creación de Reunión
    Cuando el actor ingresa el nombre "Reunión Sin Fecha Inicio" y deja la fecha de inicio vacía
    Y el actor hace clic en "Guardar"
    Entonces la URL permanece en "#Meeting/create"
    Y el formulario muestra un indicador de error para el campo "dateStart"

  Escenario: [Error] Rechaza la creación cuando la fecha de fin es anterior a la de inicio (inconsistencia temporal)
    Dado que la API de Reuniones está configurada para responder con error 422
    Y que el actor navega al formulario de creación de Reunión
    Cuando el actor ingresa el nombre de reunión "Reunión Anacrónica"
    Y el actor ingresa inicio "10:00" y fin "09:30" del "2026-11-10"
    Y el actor hace clic en "Guardar"
    Entonces la respuesta de reunión interceptada tiene el código 422
    Y el mensaje de error de reunión contiene "posterior a la fecha de inicio"
    Y la URL permanece en "#Meeting/create"

  Escenario: [Error] Manejo de error 500 al fallar la persistencia de la reunión
    Dado que la API de Reuniones está configurada para responder con error 500
    Y que el actor navega al formulario de creación de Reunión
    Cuando el actor ingresa el nombre de reunión "Reunión Fallo BD" con fecha de inicio "2026-11-10" a las "11:00"
    Y el actor hace clic en "Guardar"
    Entonces la respuesta de reunión interceptada tiene el código 500
    Y el mensaje de error de reunión contiene "Fallo en la persistencia"
    Y aparece una notificación de error en la interfaz
    Y la URL permanece en "#Meeting/create"

