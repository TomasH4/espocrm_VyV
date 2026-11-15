# language: es
Característica: F1 - Validación de Transición de Estados de Casos
  Como especialista de soporte técnico en EspoCRM
  Quiero gestionar el ciclo de vida de los casos mediante transiciones controladas
  Para garantizar que ningún ticket se cierre sin resolución ni pase a estados inconsistentes

  Antecedentes:
    Dado que Andres inicia sesión en la plataforma con credenciales válidas
    Y navega al módulo de "Case"

  Escenario: Transición exitosa de un Caso a estado Assigned
    Cuando Andres registra un nuevo caso con nombre "Error en pasarela de pagos" y estado "New"
    Y actualiza el estado del caso a "Assigned"
    Entonces el caso debe reflejar exitosamente su nuevo estado "Assigned"

  Escenario: Rechazo de creación de caso sin nombre requerido
    Cuando intenta registrar un caso con nombre vacío
    Entonces el sistema debe impedir el guardado y mostrar mensaje de validación
