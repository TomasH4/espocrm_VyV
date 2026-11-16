# language: es
Característica: F4 - Evaluación y Escalado de Tareas Vencidas
  Como coordinador de operaciones
  Quiero supervisar la fecha de compromiso de las tareas y detectar atrasos
  Para activar protocolos de escalado a líderes de área en tareas críticas

  Antecedentes:
    Dado que Andres inicia sesión en la plataforma con credenciales válidas
    Y navega al módulo de "Task"

  Escenario: Registro de tarea en tiempo con fecha límite establecida
    Cuando Andres programa una tarea "Auditoría de Procesos" con estado "Not Started" y prioridad "Normal"
    Entonces la tarea debe crearse exitosamente en el módulo de actividades

  Escenario: Finalización oportuna de una tarea
    Cuando Andres marca como "Completed" una tarea existente
    Entonces la tarea debe quedar registrada como completada sin mora
