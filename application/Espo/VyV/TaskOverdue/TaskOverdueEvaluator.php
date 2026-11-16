<?php
/**
 * TaskOverdueEvaluator.php
 *
 * Servicio de aplicacion para evaluar el vencimiento de Tareas (Tasks),
 * calcular los dias de mora, determinar la severidad del retraso y
 * activar protocolos de escalado automatico a supervisores o gerentes.
 *
 * Mapeo de Nodos para Analisis Estructural de Caja Blanca (Nodos 1 al 24).
 * Complejidad Ciclomatica de McCabe V(G) = 11 (10 predicados + 1).
 *
 * Funcionalidad 4 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\TaskOverdue;

use DateTimeImmutable;
use DateTimeZone;
use Exception;

final class TaskOverdueEvaluator
{
    private const ALLOWED_STATUSES = ['Not Started', 'Started', 'Completed', 'Canceled', 'Deferred'];
    public const DEFAULT_FALLBACK_ESCALATION_USER = 'admin-system-user';

    public function __construct(
        private readonly TaskRepository $repository
    ) {}

    /**
     * Evalua una tarea y ejecuta acciones de escalado segun su grado de atraso.
     *
     * @param array<string,mixed> $data Parametros de la tarea a evaluar.
     *
     * @return TaskOverdueResult Value Object con el diagnostico y resultado.
     */
    public function evaluate(array $data): TaskOverdueResult
    {
        // Nodo 1: Captura y normalizacion de parametros de entrada
        $taskId          = isset($data['taskId']) ? trim((string) $data['taskId']) : '';
        $dueDateRaw      = isset($data['dueDate']) ? trim((string) $data['dueDate']) : '';
        $status          = isset($data['status']) ? trim((string) $data['status']) : 'Not Started';
        $priority        = isset($data['priority']) ? trim((string) $data['priority']) : 'Normal';
        $assignedUserId  = isset($data['assignedUserId']) ? trim((string) $data['assignedUserId']) : '';
        $evalDateRaw     = isset($data['currentEvaluationDate']) ? trim((string) $data['currentEvaluationDate']) : null;

        // Nodo 2: Decision 1 - Verificacion de identificador obligatorio
        if ($taskId === '') {
            // Nodo 3: Retorno error 400 por taskId ausente
            return TaskOverdueResult::failure(400, 'El campo taskId es obligatorio');
        }

        // Nodo 4: Decision 2 - Verificacion de estado en catalogo permitido
        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            // Nodo 5: Retorno error 400 por estado no reconocido
            return TaskOverdueResult::failure(400, "Estado de tarea '$status' no valido");
        }

        // Nodo 6: Decision 3 - Parsing y validacion de fecha limite dueDate
        try {
            $dueDate = new DateTimeImmutable($dueDateRaw, new DateTimeZone('UTC'));
        } catch (Exception) {
            // Nodo 7: Retorno error 400 por fecha dueDate invalida
            return TaskOverdueResult::failure(400, 'El formato de fecha dueDate no es valido');
        }

        // Nodo 8: Decision 4 - Tarea ya finalizada o cancelada
        if (in_array($status, ['Completed', 'Canceled'], true)) {
            // Nodo 9: Retorno exitoso 200 sin mora ni escalado
            return TaskOverdueResult::success($taskId, 0, 'None', false, null);
        }

        // Resolucion de fecha de corte
        $evalDate = $evalDateRaw !== null
            ? new DateTimeImmutable($evalDateRaw, new DateTimeZone('UTC'))
            : new DateTimeImmutable('now', new DateTimeZone('UTC'));

        // Nodo 10: Decision 5 - Comparacion temporal entre fecha de corte y dueDate
        if ($evalDate <= $dueDate) {
            // Nodo 11: Tarea en tiempo (OnTime)
            $overdueDays = 0;
            $severity = 'None';
            $isEscalated = false;
            $escalatedToUserId = null;
        } else {
            // Nodo 12: Tarea en mora (Overdue)
            $diffSeconds = $evalDate->getTimestamp() - $dueDate->getTimestamp();
            $overdueDays = (int) max(1, floor($diffSeconds / 86400));

            // Nodo 13: Decision 6 - Clasificacion de severidad de mora
            if ($overdueDays <= 2 && $priority !== 'Urgent') {
                $severity = 'Minor';
                $isEscalated = false;
                $escalatedToUserId = null;
            } elseif ($overdueDays <= 7 && $priority !== 'Urgent') {
                // Nodo 14: Decision 7 - Mora moderada -> Escalado a Supervisor
                $severity = 'Moderate';
                $isEscalated = true;
                $supervisorId = $assignedUserId !== '' ? $this->repository->findSupervisorId($assignedUserId) : null;
                // Nodo 15: Decision 8 - Fallback si no tiene supervisor
                $escalatedToUserId = $supervisorId ?? self::DEFAULT_FALLBACK_ESCALATION_USER;
            } else {
                // Nodo 16: Mora critica (>7 dias o prioridad Urgent) -> Escalado a Gerente
                $severity = 'Critical';
                $isEscalated = true;
                $managerId = $assignedUserId !== '' ? $this->repository->findManagerId($assignedUserId) : null;
                // Nodo 17: Decision 9 - Fallback si no tiene gerente
                $escalatedToUserId = $managerId ?? self::DEFAULT_FALLBACK_ESCALATION_USER;
            }
        }

        // Nodo 18: Persistencia del diagnostico en la base de datos
        $persisted = $this->repository->saveEvaluation(
            $taskId,
            $overdueDays,
            $severity,
            $isEscalated,
            $escalatedToUserId
        );

        // Nodo 19: Decision 10 - Verificacion de persistencia exitosa
        if (!$persisted) {
            // Nodo 20: Retorno error 500 por fallo de persistencia
            return TaskOverdueResult::failure(500, 'Fallo en la persistencia de la evaluacion de la tarea');
        }

        // Nodo 21: Retorno exitoso 200 con Value Object completo
        return TaskOverdueResult::success($taskId, $overdueDays, $severity, $isEscalated, $escalatedToUserId);

        // Nodo 22: Fin del metodo
    }
}
