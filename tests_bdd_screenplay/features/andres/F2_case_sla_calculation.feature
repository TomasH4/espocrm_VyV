# language: es
Característica: F2 - Cálculo de SLA y Tiempo Límite de Atención
  Como analista de mesa de ayuda
  Quiero clasificar los casos según prioridad y nivel de servicio del cliente
  Para priorizar los tickets de mayor impacto y evitar el incumplimiento de SLA

  Antecedentes:
    Dado que Andres inicia sesión en la plataforma con credenciales válidas
    Y navega al módulo de "Case"

  Escenario: Registro de caso con prioridad Urgent para atención prioritaria
    Cuando Andres registra un caso crítico con prioridad "Urgent" y tipo "Incident"
    Entonces el caso debe quedar registrado con prioridad "Urgent" en el sistema
    Y debe visualizarse correctamente en el listado de casos activos

  Escenario: Registro de caso informativo con prioridad Low
    Cuando Andres registra un caso con prioridad "Low" y tipo "Question"
    Entonces el caso debe ser clasificado con nivel de servicio estándar
