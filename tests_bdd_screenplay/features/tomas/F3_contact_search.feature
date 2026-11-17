# language: es
# encoding: UTF-8

Característica: Búsqueda y Filtrado de Contactos (Contact Search & Filtering)
  Como usuario del CRM
  Quiero buscar y filtrar contactos por nombre parcial, exacto o por estado
  Para localizar rápidamente los registros de interés

  Antecedentes:
    Dado que el actor "Tomas" ha iniciado sesión en EspoCRM
    Y que existen los siguientes contactos semilla en el sistema:
      | firstName | lastName | emailAddress         | status   |
      | Carlos    | Gómez    | cgomez@empresa.com   | Active   |
      | Ana       | Gomis    | agomis@empresa.com   | Active   |
      | Luis      | Restrepo | lrestrepo@empresa.com | Inactive |

  Escenario: [Exitoso] Realiza búsqueda parcial (LIKE %Gom%) y recupera los contactos coincidentes
    Dado que el actor navega al listado de Contactos
    Cuando el actor busca el término "Gom"
    Entonces la lista muestra al menos 2 resultados
    Y la lista contiene el contacto "Carlos Gómez"
    Y la lista contiene el contacto "Ana Gomis"
    Y la lista no contiene el contacto "Luis Restrepo"

  Escenario: [Exitoso] Realiza búsqueda exacta por nombre completo y recupera únicamente el contacto indicado
    Dado que el actor navega al listado de Contactos
    Cuando el actor busca el término "Carlos Gómez"
    Entonces la lista contiene el contacto "Carlos Gómez"
    Y la lista no contiene el contacto "Ana Gomis"
    Y la lista no contiene el contacto "Luis Restrepo"

  Escenario: [Exitoso] Filtra contactos y muestra el contacto inactivo al buscarlo por apellido
    Dado que el actor navega al listado de Contactos
    Cuando el actor busca el término "Restrepo"
    Entonces la lista contiene el contacto "Luis Restrepo"
    Y la lista no contiene el contacto "Carlos Gómez"
    Y la lista no contiene el contacto "Ana Gomis"

  Escenario: [Alternativo] Muestra indicador "No Data" ante un término de búsqueda inexistente
    Dado que el actor navega al listado de Contactos
    Cuando el actor busca el término "TerminoInexistenteXYZ"
    Entonces la lista muestra el mensaje "No Data"
    Y la lista no contiene ninguna fila de resultados

  Escenario: [Error] Manejo de error 500 al fallar el motor de base de datos en la consulta
    Dado que la API de Contactos está configurada para responder con error 500
    Cuando el actor navega al listado de Contactos
    Entonces la respuesta de contactos interceptada tiene el código 500
    Y el mensaje de error de contactos contiene "Fallo en la ejecucion"
    Y aparece una notificación de error en la interfaz

