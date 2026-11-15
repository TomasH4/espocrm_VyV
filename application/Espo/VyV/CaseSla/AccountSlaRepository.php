<?php
/**
 * AccountSlaRepository.php
 *
 * Interfaz de repositorio para consultar el nivel de servicio (SLA Tier) de la Cuenta
 * y persistir las metas de tiempo limite calculadas para el Caso.
 *
 * Funcionalidad 2 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\CaseSla;

interface AccountSlaRepository
{
    /**
     * Obtiene el plan de soporte / nivel SLA asociado a la cuenta del cliente.
     * Retorna 'Platinum', 'Gold', 'Silver', o 'Standard'.
     *
     * @param string $accountId Identificador de la cuenta corporativa.
     *
     * @return string|null Nivel SLA configurado o null si no se encuentra.
     */
    public function findSlaTierByAccountId(string $accountId): ?string;

    /**
     * Persiste los tiempos limites calculados de SLA en el caso.
     *
     * @param string $caseId            Identificador del caso.
     * @param float  $responseHours     Horas acordadas para primera respuesta.
     * @param float  $resolutionHours   Horas acordadas para resolucion definitiva.
     * @param string $firstResponseDue  Fecha y hora limite de respuesta (Y-m-d H:i:s).
     * @param string $resolutionDue     Fecha y hora limite de resolucion (Y-m-d H:i:s).
     * @param string $slaStatus         Estado del SLA ('OnTrack', 'AtRisk', 'Breached').
     *
     * @return bool True si la operacion fue exitosa, false en caso contrario.
     */
    public function saveSlaLimits(
        string $caseId,
        float  $responseHours,
        float  $resolutionHours,
        string $firstResponseDue,
        string $resolutionDue,
        string $slaStatus
    ): bool;
}
