<?php
/**
 * CaseRepository.php
 *
 * Interfaz de repositorio para la persistencia de Casos y actualizacion de estados.
 * Define el contrato desacoplado de la base de datos para soporte de pruebas unitarias.
 *
 * Funcionalidad 1 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\CaseStatus;

interface CaseRepository
{
    /**
     * Actualiza el estado de un caso en la base de datos.
     *
     * @param string      $caseId            Identificador unico del caso.
     * @param string      $targetStatus      Nuevo estado a establecer.
     * @param string|null $assignedUserId    Usuario responsable asignado (opcional segun estado).
     * @param string|null $resolutionComment Justificacion o resolucion del cambio de estado.
     *
     * @return bool True si la actualizacion fue exitosa, false en caso contrario.
     */
    public function updateStatus(
        string $caseId,
        string $targetStatus,
        ?string $assignedUserId,
        ?string $resolutionComment
    ): bool;

    /**
     * Obtiene el estado actual registrado de un caso.
     *
     * @param string $caseId Identificador unico del caso.
     *
     * @return string|null Estado actual o null si el caso no existe.
     */
    public function findStatusById(string $caseId): ?string;
}
