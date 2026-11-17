# language: es
# encoding: UTF-8

Característica: Conversión Transaccional de Lead en Contacto y Cuenta
  Como usuario del CRM
  Quiero convertir un Lead en Contacto y opcionalmente en Cuenta
  Para registrar la transición de un prospecto a cliente activo

  Antecedentes:
    Dado que el actor "Tomas" ha iniciado sesión en EspoCRM

  Escenario: [Exitoso] Conversión B2B Completa: crea Contacto y Cuenta vinculada a partir de un Lead con empresa
    Dado que existe un Lead corporativo con nombre único, empresa y estado "Assigned"
    Y que la API de conversión de Lead está interceptada
    Cuando el actor navega a la vista del Lead
    Y el actor hace clic en el botón "Convert"
    Y el actor marca los checkboxes de "Contact" y "Account"
    Y el actor hace clic en el botón de confirmación "Convert"
    Entonces la API de conversión devuelve un código 200 o 201
    Y el Lead muestra el estado "Converted"
    Y la página muestra el nombre de la empresa del Lead

  Escenario: [Exitoso] Conversión B2C: crea únicamente el Contacto sin Cuenta para un Lead persona natural
    Dado que existe un Lead persona natural con nombre único y sin empresa
    Y que la API de conversión de Lead está interceptada
    Cuando el actor navega a la vista del Lead
    Y el actor hace clic en el botón "Convert"
    Y el actor marca únicamente el checkbox de "Contact"
    Y el actor hace clic en el botón de confirmación "Convert"
    Entonces la API de conversión devuelve un código 200 o 201
    Y el cuerpo de la respuesta no contiene un "createdAccountId"
    Y el Lead muestra el estado "Converted"

  Escenario: [Alternativo] Verifica la propagación exacta del email al nuevo Contacto
    Dado que existe un Lead con email único en estado "In Process"
    Y que la API de conversión de Lead está interceptada
    Cuando el actor navega a la vista del Lead
    Y el actor hace clic en el botón "Convert"
    Y el actor marca el checkbox de "Contact"
    Y el actor hace clic en el botón de confirmación "Convert"
    Entonces la API de conversión devuelve un código 200 o 201
    Y el Lead muestra el estado "Converted"
    Y la página muestra el email del Lead convertido

  Escenario: [Error] Rechaza el intento de doble conversión sobre un Lead con estado "Converted"
    Dado que existe un Lead con estado "Converted"
    Cuando el actor navega a la vista del Lead
    Entonces el Lead muestra el estado "Converted"
    Y el botón "Convert" no existe en la vista del Lead

  Escenario: [Error] Rollback transaccional ante fallo durante la conversión (HTTP 500)
    Dado que existe un Lead activo con nombre único
    Y que la API de conversión está configurada para responder con error 500
    Cuando el actor navega a la vista del Lead
    Y el actor hace clic en el botón "Convert"
    Y el actor marca el checkbox de "Contact"
    Y el actor hace clic en el botón de confirmación "Convert"
    Entonces la respuesta de conversión interceptada tiene el código 500
    Y el mensaje de error de conversión contiene "Fallo en la transaccion"
    Y aparece una notificación de error en la interfaz

