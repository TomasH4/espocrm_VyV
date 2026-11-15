<?php
/**
 * TaskRepository.php
 *
 * Interfaz de repositorio para evaluar tareas vencidas,
 * buscar jerarquia de escalado y persistir los resultados de evaluacion.
 *
 * Funcionalidad 4 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\TaskOverdue;

interface TaskRepository
{
    /**
     * Obtiene el identificador del supervisor directo del usuario asignado.
     *
     * @param string $userId Identificador del usuario asignado.
     *
     * @return string|null Identificador del supervisor o null si no esta configurado.
     */
    public function findSupervisorId(string $userId): ?string;

    /**
     * Obtiene el identificador del gerente de area / nivel superior.
     *
     * @param string $userId Identificador del usuario asignado.
     *
     * @return string|null Identificador del gerente o null si no esta configurado.
     */
    public function findManagerId(string $userId): ?string;

    /**
     * Persiste los resultados de la evaluacion y accion de escalado en la tarea.
     *
     * @param string      $taskId            Identificador de la tarea.
     * @param int         $overdueDays       Dias de mora calculados.
     * @param string      $severity          Severidad ('None', 'Minor', 'Moderate', 'Critical').
     * @param bool        $isEscalated       Indica si se aplico escalado a un superior.
     * @param string|null $escalatedToUserId Usuario al que se escalo la responsabilidad.
     *
     * @return bool True si la actualizacion fue exitosa, false en caso contrario.
     */
    public function saveEvaluation(
        string  $taskId,
        int     $overdueDays,
        string  $severity,
        bool    $isEscalated,
        ?string $escalatedToUserId
    ): bool;
}
