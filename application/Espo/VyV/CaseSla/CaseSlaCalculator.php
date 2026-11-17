<?php
/**
 * CaseSlaCalculator.php
 *
 * Servicio de aplicacion para calcular los tiempos limites de atencion (SLA),
 * primera respuesta y resolucion en horas habiles o calendario segun el
 * acuerdo de nivel de servicio del cliente y la prioridad del ticket.
 *
 * Mapeo de Nodos para Analisis Estructural de Caja Blanca (Nodos 1 al 22).
 * Complejidad Ciclomatica de McCabe V(G) = 10 (9 predicados + 1).
 *
 * Funcionalidad 2 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\CaseSla;

use DateTimeImmutable;
use DateTimeZone;
use Exception;

final class CaseSlaCalculator
{
    private const ALLOWED_PRIORITIES = ['Urgent', 'High', 'Normal', 'Low'];

    private const TIER_BASE_HOURS = [
        'Platinum' => ['response' => 1.0, 'resolution' => 4.0],
        'Gold'     => ['response' => 2.0, 'resolution' => 8.0],
        'Silver'   => ['response' => 4.0, 'resolution' => 24.0],
        'Standard' => ['response' => 8.0, 'resolution' => 48.0],
    ];

    private const PRIORITY_MULTIPLIERS = [
        'Urgent' => 0.50,
        'High'   => 0.75,
        'Normal' => 1.00,
        'Low'    => 1.50,
    ];

    private const DATE_TIME_FORMAT = 'Y-m-d H:i:s';

    public function __construct(
        private readonly AccountSlaRepository $repository
    ) {}

    /**
     * Calcula los plazos de cumplimiento del SLA para un caso.
     *
     * @param array<string,mixed> $data Parametros de calculo.
     *
     * @return CaseSlaResult Value Object con los resultados.
     */
    public function calculate(array $data): CaseSlaResult
    {
        // Nodo 1: Captura y normalizacion de parametros de entrada
        $caseId              = isset($data['caseId']) ? trim((string) $data['caseId']) : '';
        $accountId           = isset($data['accountId']) ? trim((string) $data['accountId']) : '';
        $priority            = isset($data['priority']) ? trim((string) $data['priority']) : 'Normal';
        $createdAtRaw        = isset($data['createdAt']) ? trim((string) $data['createdAt']) : '';
        $businessHoursOnly   = !isset($data['businessHoursOnly']) || (bool) $data['businessHoursOnly'];
        $nowRaw              = isset($data['currentTime']) ? trim((string) $data['currentTime']) : null;

        // Nodo 2 a 7: Verificacion y validacion de parametros obligatorios
        $validation = $this->validateRequest($caseId, $priority, $createdAtRaw);
        if ($validation instanceof CaseSlaResult) {
            return $validation;
        }
        $createdAt = $validation;

        // Nodo 8 a 9: Resolucion del SLA Tier a traves del repositorio
        $slaTier = $this->resolveSlaTier($accountId);

        // Nodo 10: Calculo de horas efectivas multiplicadas por severidad
        $baseConfig    = self::TIER_BASE_HOURS[$slaTier];
        $multiplier    = self::PRIORITY_MULTIPLIERS[$priority];
        $respHours     = (float) round($baseConfig['response'] * $multiplier, 2);
        $resolHours    = (float) round($baseConfig['resolution'] * $multiplier, 2);

        // Nodo 11 a 13: Modalidad de calculo: Horas habiles vs Calendario
        if ($businessHoursOnly) {
            $firstResponseDue = $this->addBusinessHours($createdAt, $respHours);
            $resolutionDue    = $this->addBusinessHours($createdAt, $resolHours);
        } else {
            $firstResponseDue = $createdAt->modify('+' . (int) round($respHours * 3600) . ' seconds');
            $resolutionDue    = $createdAt->modify('+' . (int) round($resolHours * 3600) . ' seconds');
        }

        // Nodo 14 a 18: Evaluacion del estado de riesgo del SLA
        $slaStatus = $this->evaluateRiskStatus($createdAt, $resolutionDue, $nowRaw);

        // Nodo 19 a 20: Persistencia de limites calculados en base de datos
        $persisted = $this->repository->saveSlaLimits(
            $caseId,
            $respHours,
            $resolHours,
            $firstResponseDue->format(self::DATE_TIME_FORMAT),
            $resolutionDue->format(self::DATE_TIME_FORMAT),
            $slaStatus
        );

        if (!$persisted) {
            return CaseSlaResult::failure(500, 'Fallo en la persistencia de los limites calculados de SLA');
        }

        // Nodo 22: Retorno exitoso 200 con Value Object
        return CaseSlaResult::success(
            $caseId,
            $slaTier,
            $respHours,
            $resolHours,
            $firstResponseDue->format(self::DATE_TIME_FORMAT),
            $resolutionDue->format(self::DATE_TIME_FORMAT),
            $slaStatus
        );
    }

    private function validateRequest(string $caseId, string $priority, string $createdAtRaw): DateTimeImmutable|CaseSlaResult
    {
        if ($caseId === '' || !in_array($priority, self::ALLOWED_PRIORITIES, true)) {
            $msg = $caseId === ''
                ? 'El campo caseId es obligatorio para calcular SLA'
                : 'Prioridad de caso no valida. Debe ser Urgent, High, Normal o Low';
            return CaseSlaResult::failure(400, $msg);
        }
        try {
            return $createdAtRaw !== ''
                ? new DateTimeImmutable($createdAtRaw, new DateTimeZone('UTC'))
                : new DateTimeImmutable('now', new DateTimeZone('UTC'));
        } catch (Exception) {
            return CaseSlaResult::failure(400, 'El formato de fecha createdAt no es valido');
        }
    }

    private function resolveSlaTier(string $accountId): string
    {
        if ($accountId !== '') {
            $foundTier = $this->repository->findSlaTierByAccountId($accountId);
            if ($foundTier !== null && isset(self::TIER_BASE_HOURS[$foundTier])) {
                return $foundTier;
            }
        }
        return 'Standard';
    }

    private function evaluateRiskStatus(DateTimeImmutable $createdAt, DateTimeImmutable $resolutionDue, ?string $nowRaw): string
    {
        $now = $nowRaw !== null ? new DateTimeImmutable($nowRaw, new DateTimeZone('UTC')) : $createdAt;
        $totalSeconds = $resolutionDue->getTimestamp() - $createdAt->getTimestamp();
        $remainingSec = $resolutionDue->getTimestamp() - $now->getTimestamp();

        if ($remainingSec <= 0) {
            return 'Breached';
        }
        if ($totalSeconds > 0 && ($remainingSec / $totalSeconds) <= 0.20) {
            return 'AtRisk';
        }
        return 'OnTrack';
    }

    /**
     * Agrega horas habiles respetando jornada de 8:00 a 17:00 UTC, Lunes a Viernes.
     */
    private function addBusinessHours(DateTimeImmutable $start, float $hours): DateTimeImmutable
    {
        $current = $start;
        $secondsToAdd = (int) round($hours * 3600);

        while ($secondsToAdd > 0) {
            // Si es fin de semana (6 = Sabado, 7 = Domingo), saltar al siguiente lunes 08:00
            $dow = (int) $current->format('N');
            if ($dow >= 6) {
                $daysToMonday = (8 - $dow);
                $current = $current->modify("+{$daysToMonday} days")->setTime(8, 0, 0);
                continue;
            }

            $hour = (int) $current->format('G');
            if ($hour < 8) {
                $current = $current->setTime(8, 0, 0);
            } elseif ($hour >= 17) {
                // Despues de horario laboral, avanzar al siguiente dia 08:00
                $current = $current->modify('+1 day')->setTime(8, 0, 0);
                continue;
            }

            // Segundos disponibles hoy hasta las 17:00
            $endOfDay = $current->setTime(17, 0, 0);
            $availableSecToday = $endOfDay->getTimestamp() - $current->getTimestamp();

            if ($secondsToAdd <= $availableSecToday) {
                $current = $current->modify("+{$secondsToAdd} seconds");
                $secondsToAdd = 0;
            } else {
                $secondsToAdd -= $availableSecToday;
                $current = $current->modify('+1 day')->setTime(8, 0, 0);
            }
        }

        return $current;
    }
}
