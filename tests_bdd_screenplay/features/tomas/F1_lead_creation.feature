# language: es
# encoding: UTF-8

Característica: Creación de un Cliente Potencial (Lead Creation)
  Como usuario del CRM EspoCRM VyV
  Quiero crear clientes potenciales con distintos conjuntos de datos
  Para registrar oportunidades de negocio en el sistema

  Principios FIRST: Fast · Independent · Repeatable · Self-Validating · Timely
  Patrón: AAA (Arrange / Act / Assert) | Screenplay: Actor -> Task -> Question

  Antecedentes:
    Dado que el actor "Tomas" ha iniciado sesión en EspoCRM

  Escenario: [Exitoso] Crea un Lead con todos los campos válidos y verifica su persistencia
    Dado que el actor navega al formulario de creación de Lead
    Cuando el actor ingresa los siguientes datos del Lead:
      | firstName   | Carlos                   |
      | lastName    | Gómez                    |
      | email       | carlos.gomez@empresa.com |
      | phoneNumber | +573001234567            |
    Y el actor hace clic en "Guardar"
    Entonces la API devuelve un código 200 o 201
    Y el cuerpo de la respuesta contiene el apellido "Gómez"
    Y la URL contiene "#Lead/view/"
    Y el encabezado de la página contiene "Carlos Gómez"

  Escenario: [Alternativo] Crea un Lead únicamente con el apellido obligatorio
    Dado que el actor navega al formulario de creación de Lead
    Cuando el actor ingresa el apellido "Torres" y deja el email en blanco
    Y el actor hace clic en "Guardar"
    Entonces la API devuelve un código 200 o 201
    Y la URL contiene "#Lead/view/"
    Y el encabezado de la página contiene "Torres"
    Y el campo de email no contiene el símbolo "@"

  Escenario: [Error] Rechaza la creación cuando el apellido está vacío o contiene solo espacios
    Dado que el actor navega al formulario de creación de Lead
    Cuando el actor ingresa solo espacios en blanco en el campo apellido
    Y el actor hace clic en "Guardar"
    Entonces la URL permanece en "#Lead/create"
    Y el formulario muestra un indicador de error para el campo "lastName"
    Y el botón "Save" permanece visible

  Escenario: [Error] Rechaza la creación cuando el email tiene un formato inválido
    Dado que el actor navega al formulario de creación de Lead
    Cuando el actor ingresa el apellido "Gómez" y el email "correo_sin_arroba.com"
    Y el actor hace clic en "Guardar"
    Entonces la URL permanece en "#Lead/create"
    Y el formulario muestra un indicador de error para el campo "emailAddress"

  Escenario: [Error] Manejo de error 500 al fallar la persistencia de base de datos
    Dado que la API de Lead está configurada para responder con error 500
    Y que el actor navega al formulario de creación de Lead
    Cuando el actor ingresa el apellido "PersistenciaError" y hace clic en "Guardar"
    Entonces la respuesta interceptada tiene el código 500
    Y el mensaje de error contiene "Fallo en la persistencia"
    Y aparece una notificación de error en la interfaz
    Y la URL permanece en "#Lead/create"

